/**
 * Created by naeltasmim on 12.02.17.
 */

const log4js = require('log4js');
const log = log4js.getLogger('Authentication.handler on pid ' + process.pid);

const authentication = require('./Authentication');
const shortid = require('shortid');
const Redis = require('ioredis');
const Security = require('./Security').security;
module.exports = function (config) {

    console.log("Authentication handler start running ...")

    let _authentication;
    const security = new Security("", { salt: "secure" } );
    authentication(config.authentication)
        .then(function (api) {
            _authentication = api;
        })
        .catch(function (e) {
            log.error(e);
        });

    const redis = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        keyPrefix: config.redis.namespace
    });

    redis.on('reconnecting', function (time) {
        log.info(`Redis reconnect ${time}`);
    });
    redis.on('error', function (time) {
        log.info(`Redis error ${time}`);
    });
    redis.on('connect', function () {
        log.info(`Redis connect `);

    });


    const _callback = function (err, result) {
        if(!err){
            this(null, {status: "ok", result: result});
        }else{
            this({status: "error", result: err});
        }
    };

    const _validation = function (arg, param) {
      return {
        status: "error",
        result: "Arguments pattern error",
        arguments: arg,
        parameter: param
      }
    }

    const setTemp = function (data) {
        let id = shortid.generate();
        redis.mset({[id] : JSON.stringify(data)});
        redis.expire(id, 9000);
        return id;
    };

    const create = function ({member, password}, callback) {
      if(member && password){
        _authentication.find(member, function (err, result) {
            if(err){
                hashPassword({password}, function(hash_error, hash) {
                  if(!hash_error) {
                    callback(null, {status: "flush", result: setTemp(["create", member, hash["result"]])});
                  }else{
                    callback({status: "error", result: hash_error});
                  }
                })
            }else{
                callback({status: "error", result: "Already exist"});
            }
        });
      }else{
        callback(_validation(arguments[0], "{member, password}"));
      }
    };

    const _create = function ({member, password}, callback) {
        _authentication.create({member: member, password: password}, _callback.bind(callback));
    };

    const destroy = function ({member}, callback) {
      if(member){
        _authentication.find(member, function (err, result) {
            if(err){
                callback({status: "error", result: "Not exist"});
            }else{
                callback(null, {status: "flush", result: setTemp(["destroy", member])});
            }
        });
      }else{
        callback(_validation(arguments[0], "{member}"));
      }
    };

    const update = function ({member, password}, callback) {
        if(member && password){
          _authentication.find(member, function (err, result) {
              if(err){
                  callback({status: "error", result: "Not exist"});
              }else{
                  callback(null, {status: "flush", result: setTemp(["update", member, password])});
              }
          });
        }else{
          callback(_validation(arguments[0], "{member, password}"));
        }
    };

    const read = function ({member}, callback) {
        if(member){
          _authentication.find(member, _callback.bind(callback));
        }else{
          callback(_validation(arguments[0], "{member}"))
        }
    };


    const createToken = function ({ data: {username} = {} }, callback) {
      if(username){
        callback(null, { status: "ok", result: security.getToken(JSON.stringify(arguments[0])) });
      }else{
        callback(_validation(arguments[0], "{data: {username}}"));
      }
    };

    const decodeToken = function ({token}, callback) {
      if(token){
        security.decodeToken(token, function(err, result) {
          if(!err){
            callback(null, {status: "ok", result: result});
          }else{
            callback({status: "errors", result: err});
          }
        });
      }else{
        callback(_validation(arguments[0], "{token}"));
      }
    };

    const hashPassword = function ({password}, callback) {
      if(password){
        security.hashPassword(password, function(err, result) {
          if(!err) {
            callback(null, {status: "ok", result: result});
          }else{
            callback({status: "error", result: err});
          }
        })
      }else{
        callback(_validation(arguments[0], "{password}"));
      }
    };

    const verifyPassword = function ({password, hash}, callback) {
      if(password && hash){
        security.verifyPassword(password, hash, function(err, result) {
          if(!err){
            callback(null, {status: "ok", result: result});
          }else{
            callback({status: "error", result: err});
          }
        })
      }else{
        callback(_validation(arguments[0], "{password, hash}"));
      }
    }


    const _update = function ({member, password}, callback) {
       _authentication.update({member: member, password: password}, _callback.bind(callback));
    };

    const _destroy = function (member, callback) {
      _authentication.delete(member, _callback.bind(callback))
    };

    const ping = function(data, callback) {
      callback(null, data);
    }

    /**
     * Here, if operation fail, we have inconsistent application data.
     * TODO: In fail situation, log data and repeat until write success and report failure
     */
    const flush = function (id, callback) {
        redis.get(id, function (redis_error, result) {
            if(!redis_error && result) {
                result = JSON.parse(result);

                switch (result[0]){
                    case "create":
                        _create({member: result[1], password: result[2]}, callback);
                        break;
                    case "destroy":
                        _destroy(result[1], callback);
                        break;
                    case "update":
                        _update({member: result[1], password: result[2]}, callback);
                        break;
                    default:
                        break;
                }

            } else if(result === null){
                callback({status: "error", result: "no key"});
            } else if(redis_error) {
                callback({status: "error", result: redis_error});
            }
        })
    };


    return new Map([
        ["create", create],
        ["read", read],
        ["update", update],
        ["delete", destroy],
        ["flush", flush],
        ["createToken", createToken],
        ["decodeToken", decodeToken],
        ["hashPassword", hashPassword],
        ["verifyPassword", verifyPassword],
        ["ping", ping]
    ]);

};

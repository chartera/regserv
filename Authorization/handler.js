/**
 * Created by naeltasmim on 15.02.17.
 */



const authorization = require('./Authorization');
const Redis = require('ioredis');
const Helper = require('./common')();

module.exports = function (config) {

    console.log("Authorization handler start running ...")

    const helper = Helper.common;
    const _ = helper.load({name: "handler", type: "-"});

    const redis = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        keyPrefix: config.redis.namespace
    });

    redis.on('reconnecting', function (time) {
        _.log.info(`Redis reconnect ${time}`);
    });
    redis.on('error', function (time) {
        _.log.info(`Redis error ${time}`);
    });
    redis.on('connect', function () {
        _.log.info(`Redis connect `);

    });

    const setTemp = function (data) {
        let id = _.shortid.generate();
        redis.mset({[id] : JSON.stringify(data)});
        redis.expire(id, 9000);
        return id;
    };

    const databaseExist = function (name, callback) {
        authorization.databaseExist(name, _.callback.bind(callback));
    };


    const create_connect = function({name, subject = name, predicate, object, ttl = "endless"} = {}, callback) {
      if(name && subject && predicate && object && ttl) {
        authorization.databaseExist(name, function (err, result) {
            if(err){
                callback(null, {status: "flush", result: setTemp(["create_connect",
                {name, subject, predicate, object, ttl}])})
            }else{
                callback({status: "error", result: "Already exist"});
            }
        })
      }else{
        callback(_.validation.signatur_error(arguments[0],
          "{name, [ttl!endless] subject, predicate, object}"));
      }
    };

    const _create_connect = function({name, subject = name, predicate, object, ttl} = {}, finish){
      _.async.auto({
          create: function(callback) {
              _create(name, function(err, result) {
                  if(!err) {
                      callback(null, "ok");
                  } else{
                      callback(err);
                  }
              });
          },
          connect: ["create", function(_, callback){
              _connect({subject, predicate, object, ttl}, function(err, result) {
                  if(!err) {
                      callback(null, "ok");
                  } else{
                      callback(err);
                  }
              });
          }],
          read: ["connect", function (test, callback) {
              read(subject, function (err, result) {
                  if(!err) {
                      callback(null, result);
                  }else{
                      callback(err);
                  }
              })
          }]
      }, function(err, result) {
          if(!err) {
              finish(null, {status: "ok", result: result});
          }else{
              finish({status: "error", result: err});
          }
      });
    };

    const _connect = function ({subject, predicate, object, ttl}, callback) {

        if(subject && predicate && object && ttl) {
            authorization.connect({
                subject: subject,
                predicate: predicate,
                object: object,
                ttl: ttl
            }, function(err, result) {
              if(!err) {
                  callback(null, {status: "ok", result: `${subject} now ${predicate} of ${object} with ttl ${ttl}`});
              }else{
                callback({status: "error", result: err});
              }
            });
        }else{
            callback("validation error");
        }
    };

    const create = function (name, callback) {
        authorization.databaseExist(name, function (err, result) {
            if(err){
                callback(null, {status: "flush", result: setTemp(["create", name])})
            }else{
                callback({status: "error", result: "Already exist"});
            }
        })
    };

    const _create = function (name, callback) {
        authorization.createDatabase(name, function(err, result){
          if(!err) {
            callback(null, {status: "ok", result: result});
          }else{
            callback({status: "error", result: err});
          }
        });
    };

    const connect = function ({subject, predicate, object, ttl = "endless" }, callback) {
      if( (subject && predicate && object && ttl) && (predicate === "creator" || predicate === "member" || predicate === "admin") )  {
        authorization.databaseExist(subject, function (err, result) {
            if (err) {
                callback({status: "error", result: "Not exist"});
            } else {
                callback(null, {
                    status: "flush", result: setTemp(["connect",
                        {
                            subject: subject,
                            predicate: predicate,
                            object: object,
                            ttl: ttl
                        }
                    ])
                })
            }
        })
      }else{
        callback(_.validation.signatur_error(arguments[0],
          "{subject, [ttl!endless], predicate: member || owner, object}"));
      }
    };


    const read = function (member, callback) {
        authorization.read(member, function(err, result) {
          if(!err) {
              callback(null, {status: "ok", result: result});
          }else{
            callback({status: "error", result: err});
          }
        });
    };

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
                        _create(result[1], callback);
                        break;
                    case "connect":
                        _connect(result[1], callback);
                        break;
                    case "create_connect":
                        _create_connect(result[1], callback);
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

    const notImpl = function (args, callback) {
        callback({status: "error", result: "Not implemented"});
    };

    return new Map([
        ["create_connect", create_connect],
        ["connect", connect],
        ["read", read],
        ["flush", flush]
    ]);

};

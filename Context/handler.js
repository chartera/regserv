/**
 * Created by naeltasmim on 16.02.17.
 */


const log4js = require('log4js'),
    log = log4js.getLogger('Context.handler on pid: ' + process.pid),
    async = require('async'),
    _ = require('lodash');
const Redis = require('ioredis');
const context = require('./Context');
const shortid = require('shortid');

// TODO: REGEX context name!

module.exports = function (config) {

    console.log("Context handler start running ...")

    const context = require('./Context')(config.couchdb);
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
    const setTemp = function (data) {
        let id = shortid.generate();
        redis.mset({[id] : JSON.stringify(data)});
        redis.expire(id, 9000);
        return id;
    };

    const createContext = function ({context: ctx, context_info, username: admin} = {}, callback) {
        if( (ctx && context_info && admin) && (context_info["type"] === "info") ) {
            async.auto({
                check_admin: function (callback) {
                    checkUser(admin, function (err, result) {
                        if(!err){
                            callback(null, "ok");
                        }else{
                            callback(err);
                        }
                    })
                },

                check_context: function (callback) {
                    checkContext(ctx, function (err, result) {
                        if(err) {
                           callback(null, "ok");
                        }else{
                            if(err === "DB_CON_FAIL"){
                              callback(err);
                            }else{
                              callback("Context already exist");
                            }
                        }
                    })
                }
            }, function (err, result) {
                if(!err){
                    callback({status: "flush", result: setTemp(["createContext", {
                        context: ctx, context_info, username: admin}])});
                }else{
                    callback(null, {status: "error", result: err});
                }
            })
        }else{
            callback({status: "error", result: "Arguments pattern error",
                arguments: arguments[0], parameter: "{context, context_info: {type: info}, username}"});
        }
    };

    const _createContext = function ({context: ctx, context_info, username: admin} = {}, callback) {
        if( (ctx && context_info && admin) && (context_info["type"] === "info") ) {
            context.createDatabase({admin: admin, database: ctx, database_info: context_info},
              function(err, result) {
                if(!err) {
                  callback(null, {status: "ok", result: result});
                }else{
                  callback({status: "error", result: err});
                }
              });

        }else{
            callback({status: "error", result: "Arguments pattern error",
                arguments: arguments[0], parameter: "context, context_info: {type: info}, username"});

        }
    };

    const createContextUser = function ({context: ctx, username, password} = {}, callback) {
       if(ctx && username && password){
           async.auto({
               check_context: function (callback) {
                   checkContext(ctx, function (err, result) {
                       if(!err){
                           callback(null, "ok");
                       }else{
                           callback("Context not exist");
                       }
                   })
               },
               check_user: function (callback) {
                   checkUser(username, function (err, result) {
                       if(err){
                           callback(null, "ok");
                       }else{
                           callback("User already exist");
                       }
                   })
               }
           }, function (err, result) {
               if(!err) {
                   callback(null, {status: "flush", result: setTemp(["createContextUser", {
                       context: ctx, username, password}])})
               }else{
                   callback({status: "error", result: err});
               }
           })
       }else{
           callback({status: "error", result: "Arguments pattern error",
               arguments: arguments[0], parameter: "{context context_info, username}"});
       }
    };
    const addDocument = function ({context: ctx, doc} = {}, callback) {
        if( (ctx && doc) && (doc["type"] === "event")){
            checkContext(ctx, function (err, result) {
                if(!err) {
                    callback(null, {status: "flush", result: setTemp(["addDocument", {context: ctx, doc}])})
                }else{
                    callback({status: "error", result: "Context not exist"});
                }
            })
        }else{
            callback({status: "error", result: "Arguments pattern error",
                arguments: arguments[0], parameter: "{context, document: {type: event}}"});
        }
    };
    const createUser = function ({username, password} = {}, callback) {
        checkUser(username, function (err, result) {
            if(err){
                callback(null, {status: "flush", result: setTemp(["createUser", {username, password}])});
            }else{
                callback({status: "error", result: "User already exist"});
            }
        })
    };
    const connectUser = function ({context: ctx, username, role} = {}, callback) {
        if((ctx && username && role) && role === "admin" || role === "member") {
            async.auto({
                check_context: function (callback) {
                    checkContext(ctx, function (err, result) {
                        if(!err) {
                            callback(null, "ok");
                        }else{
                            callback("Context not exist");
                        }
                    })
                },
                check_user: function (callback) {
                    checkUser(username, function (err, result) {
                        if(!err) {
                            callback(null, "ok");
                        }else{
                            callback("User not exist");
                        }
                    })
                },
                check_role: function (callback) {
                    _checkRole({context: ctx, username, role}, function (err, result) {
                        if(!err){
                            callback(null, result);
                        }else{
                            callback("User with this role already exist");
                        }
                    })
                }
            }, function (err, result) {
                if(!err) {
                    callback({status: "flush", result: setTemp(["connectUser", {context: ctx, username, role}])});
                }else{
                    callback({status: "error", result: err});
                }
            })
        }else{
            callback({status: "error", result: "Arguments pattern error",
                arguments: arguments[0], parameter: "{context, username, role: member || admin}"});
        }
    };

    const checkContext = function (database, callback) {
        context.checkDatabase(database, _callback.bind(callback));
    };
    const checkUser = function (username, callback) {
        context.checkUser(username, _callback.bind(callback));
    };

    const _createNewUserForContext = function ({context: ctx, username, password} = {}, callback) {
       if(ctx && username && password) {
           async.auto({
               check_context: function (callback) {
                   checkContext(ctx, function (err, result) {
                       if(!err){
                           callback(null, "ok");
                       }else{
                           callback(err);
                       }
                   })
               },
               create_user: ["check_context", function (_, callback) {
                   _createUser({username, password, role: `${ctx}_member`}, function (err, result) {
                       if(!err){
                           callback(null, result);
                       }else{
                           callback(err);
                       }
                   });
               }],
               update_context: ["create_user", function (_, callback) {
                   const document = {type: "member", name: username};
                   _addContextDocument({context: ctx, document}, function (err, result) {
                       if(!err) {
                           callback(null, result);
                       }else{
                           callback(err);
                       }
                   })
               }]

           }, _callback.bind(callback));
       }else{
           callback("Validation error");
       }
    };
    const _addContextDocument = function ({context: ctx, doc} = {}, callback) {
        if((ctx && doc) && (doc["type"] === "event" || doc["type"] === "member") ) {
            context.addDocument({database: ctx, doc}, function (err, result) {
                if(!err){
                    callback(null, result);
                }else{
                    callback(err);
                }
            });
        }else{
            callback({status: "error", result: "Validation error", arguments: arguments[0],
                parameter: "{context, document: {type: event || member}"});
        }

    };
    const _connectUser = function ({context: ctx, username, role} = {}, callback) {
        if( (ctx && username && role) && role === "admin" || role === "member" ) {


            async.auto({
                add_role: function (callback) {
                    context.addRole(ctx, username, role, function (err, result) {
                        if(!err) {
                            callback(null, result);
                        }else{
                            callback(err);
                        }
                    })
                },
                update_context: ["add_role", function (_, callback) {
                   if(role === "admin") {
                       callback(null, "ok");
                   }else{
                       _addContextDocument({context: ctx, document: {type: "member", member: username}}, function (err, result) {
                           if(!err) {
                               callback(null, result);
                           }else{
                               callback(err);
                           }
                       })
                   }
                }]
            }, _callback.bind(callback));



        }else{
            callback({status: "error", result: "Validation error", arguments: arguments[0],
                parameter: "{context, username, role: admin || member}"});
        }
    };

    const _createUser = function ({username, password, role} = {}, callback) {
        if(username && password){
            context.createUser(username, password, role, function(err, result) {
              if(!err){
                callback(null, {status: "ok", result: `${username} created`});
              }else{
                callback({status: "error", result: err});
              }
            });
        }else{
            callback({status: "error", result: "Validation error"});
        }
    };
    const _checkRole = function ({context: database, username, role} = {}, callback) {
        if( (context && username && role) && (role === "admin" || role === "member")){
            context.checkRole({database, username, role}, _callback.bind(callback));
        }else{
            callback({status: "error", result: "Validation error", arguments: arguments[0],
                parameter: "{context, username, role: admin || member}"});
        }
    };


    const flush = function (id, callback) {
        redis.get(id, function (redis_error, result) {
            if(!redis_error && result) {
                result = JSON.parse(result);
                switch (result[0]){
                    case "createContext":
                        console.log("redis result", result[1]);
                        _createContext(result[1], callback);
                        break;
                    case "createContextUser":
                        _createNewUserForContext(result[1], callback);
                        break;
                    case "addDocument":
                        _addContextDocument(result[1], callback);
                        break;
                    case "createUser":
                        _createUser(result[1], callback);
                        break;
                    case "connectUser":
                        _connectUser(result[1], callback);
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
        ["flush", flush],
        ["createContext", createContext],
        ["createContextUser", createContextUser],
        ["createUser", createUser],
        ["connectUser", connectUser],
        ["addDocument", addDocument]
    ]);
};

/**
 * Created by naeltasmim on 16.02.17.
 */


const
    log4js = require('log4js'),
    log = log4js.getLogger('Context.context on pid ' + process.pid),
    async = require('async'),
    Nano = require('nano');

// TODO:
//  - Connection check to couchdb

module.exports = function (config) {

    const nano = Nano(config.host);
    const design_doc = require('./design')();
    const USER_NAMESPACE = config.namespace;
    const getName = function (name) {
        return `${USER_NAMESPACE}:${name}`;
    };
    const _callback = function (err, result) {
        if(!err) {
            this(null, result);
        }else{
            this(err);
        }
    };
    const _error = function ([fun, step, data, err]) {
        return {
            date: new Date(),
            service: "Context",
            origin: "Context.js",
            fun: fun,
            step: step,
            data: data,
            err: err
        }
    };

    const nanoPost = function (path, body, callback) {
        nano.request({
            method: "post",
            path: path,
            body: body
        },  _callback.bind(callback));
    };
    const nanoPut = function (path, body, callback) {
        nano.request({
            method: "put",
            path: path,
            body: body
        },  _callback.bind(callback));
    };
    const nanoGet = function (database, doc, callback) {
        nano.request({
            method: "get",
            db: database,
            doc: doc,
        },  _callback.bind(callback));
    };
    const checkDatabase = function (database, callback) {
        nanoGet(database, null, function (err, result) {
            if(!err){
                callback(null, result);
            }else{
                if(!err) {
                    callback("Database not exist");
                }else{
                  callback("DB_CON_FAIL");
                }

            }
        });
    };
    const checkUser = function (username, callback) {
        nanoGet("_users", `${getName(username)}`, function (err, result) {
            if(!err){
                callback(null, result);
            }else{
                if(!err) {
                  callback("User not exist");
                }else{
                  callback("DB_CON_FAIL");
                }
            }
        });
    };
    const createUser = function (username, password, role, finish) {
        role ? role = [role] : role = [];
        async.auto({
            check_user: function (callback) {
                checkUser(username, function (err, result) {
                    if(err){
                        callback(null, result);
                    }else{
                        callback(_error([
                            "createUSer", "check_user", username, `Username ${username} already exist`
                        ]));
                    }
                })
            },
            create_user: ["check_user", function (result, callback) {
                nanoPut(`_users/${USER_NAMESPACE}:${username}`,{
                    "name": username,
                    "password": password,
                    "roles": role,
                    "type": "user"
                }, callback)
            }]
        }, _callback.bind(finish));
    };
    const addDocument = function ({database, doc}, callback) {
        async.auto({
            check_database: function (callback) {
                checkDatabase(database, function (err, result) {
                    if(!err){
                        callback(null, "ok");
                    }else{
                        callback(_error([
                            "addDocument", "check_database", database, "Database not exist"
                        ]));
                    }
                })
            },

            put_document: ["check_database", function (_, callback) {
                nanoPost(database, doc, function (err, result) {
                    if(!err) {
                        callback(null, "ok");
                    }else{
                        callback(_error([
                            "addDocument", "put_document", doc, err
                        ]));
                    }
                })
            }]
        }, _callback.bind(callback));
    };
    const _createDatabase = function (database, info, finish) {
        async.auto({
            check_database: function (callback) {
                checkDatabase(database, function (err, result) {
                    if(err){
                        callback(null, "ok");
                    }else{
                        callback(_error([
                            "createDatabase", "check_database", database, "Database already exist"
                        ]));
                    }
                })
            },
            create_database : ["check_database", function ({check_database: db}, callback) {
                nanoPut(database, null, function (err, result) {
                    if(!err){
                        callback(null, "ok");
                    }else{
                        callback([
                            "createDatabase", "create_database", database, err
                        ]);
                    }
                })
            }],
            set_police: ["create_database", function (result, callback) {
                createDatabaseSecurityPolice(database, function (err, result) {
                    if(!err) {
                        callback(null, "ok");
                    }else{
                        callback([
                            "createDatabase", "set_police", database, err
                        ]);
                    }
                })
            }],
            put_info: ["create_database", function ({create_database: db}, callback) {
                nanoPost(database, info, function (err, result) {
                    if(!err) {
                        callback(null, "ok");
                    }else {
                        callback([
                            "createDatabase", "put_info", database, err
                        ]);
                    }
                })
            }],
            put_design: ['put_info', function ({create_database: db}, callback) {
                nanoPost(`${database}/_bulk_docs`, design_doc.createMember(), function (err, result) {
                    if(!err){
                        callback(null, "ok");
                    }else{
                        callback(err);
                    }
                })
            }]
        }, _callback.bind(finish));
    };
    const createDatabaseSecurityPolice = function (database, callback) {
        nanoPut(`${database}/_security`, design_doc.getPolice(database), _callback.bind(callback));
    };
    const createDatabase = function ({admin, database, database_info},finish) {

        async.auto({

            check_user: function (callback) {
                checkUser(admin, function (err, result) {
                    if(!err){
                        callback(null, result);
                    }else{
                        callback(_error([
                            "createDatabase", "check_user", admin, `Username ${admin} not exist`
                        ]));
                    }
                })
            },

            create_database: ["check_user", function ({check_database, check_user}, callback) {
                _createDatabase(database, database_info, function (err, result) {
                    if(!err){
                        callback(null, database);
                    }else{
                        callback(_error([
                            "createDatabase", "create_database", `${check_database}-${check_user}`, JSON.stringify(err)
                        ]));
                    }
                })
            }],

            update_role: ["create_database", "check_user", function ({check_database, check_user: user}, callback) {
                const user_with_roles = design_doc.getInitialRoles(user, database);
                nanoPut(`_users/${getName(admin)}`,user_with_roles, function (err, result) {
                    if(!err) {
                        callback(null, "ok");
                    }else{
                        callback(_error([
                            "createDatabase", "update_role", `Username: ${admin}`, err
                        ]));
                    }
                })
            }]
        }, _callback.bind(finish));
    };
    const addRole = function (db, username, role, finish) {
        async.auto({
            check_user: function (callback) {
                checkUser(username, function (err, result) {
                    if(!err){
                        callback(null, result);
                    }else{
                        callback(_error([
                            "updateUserRole", "check_user", username, `Username ${username} not exist`
                        ]));
                    }
                })
            },

            check_database: function (callback) {
                checkDatabase(db, function (err, result) {
                    if(!err){
                        callback(null, "ok");
                    }else{
                        callback(_error([
                            "updateUserRole", "check_database", db, `Database ${db} not exist`
                        ]));
                    }
                })
            },

            update_role: ["check_database","check_user", function ({_, check_user: user}, callback) {

                const _role = `${db}_${role}`;
                if( (role === "member" || role === "admin")) {

                    if(!user.roles.includes(_role)) {
                        user.roles.push(_role);
                        nanoPut(`_users/${getName(username)}`,user, function (err, result) {
                            if(!err) {
                                callback(null, "ok");
                            }else{
                                callback(_error([
                                    "updateUserRole", "update_role", `Username: ${username}, Role: ${role}`, err
                                ]));
                            }
                        })
                    }else{
                        callback("User with this role is already set");
                    }
                }else{
                    callback("Role is not valid, only member or admin");
                }
            }]
        }, _callback.bind(finish));
    };
    const checkRole = function ({database: db, username, role}, callback) {
        checkUser(username, function (err, result) {
            if(!err) {
                const _role = `${db}_${role}`;
                if( (role === "member" || role === "admin")) {
                    if(!result.roles.includes(_role)){
                        callback(null, "Role not exist");
                    }else{
                        callback("Role already exist");
                    }
                }else{
                    callback("Not valid role, only member or admin");
                }
            }else{
                callback("User not exist");
            }
        })
    };

    return {
        checkDatabase: checkDatabase,
        checkUser: checkUser,
        createUser: createUser,
        addRole: addRole,
        createDatabase: createDatabase,
        addDocument: addDocument,
        checkRole: checkRole
    }

};

const levelup = require("levelup");
const levelgraph = require("levelgraph");

const fs = require('fs');

const log4js = require('log4js');
const log = log4js.getLogger('Authorization on pid ' + process.pid);

const pre = "node_m_authorization_";

const databaseExist = function (name, callback) {
    try {
        fs.accessSync(`${pre}${name}`);
        callback(null, "DB exist")
    } catch (e) {
        callback("DB not exist");
    }
};

const getOrCreateDB = function (name, callback) {
    levelup(`${pre}${name}`, function (err, db) {
        if(!err) {
            callback(null, db);
        }else{
            callback(err);
        }
    });
};

const createDatabase = function (name, callback) {
    databaseExist(name, function (err, result) {
        if(err) {
            getOrCreateDB(name, function (err, db) {
                if(!err) {
                    db.close();
                    callback(null, `DB ${name} successful created`);
                }else{
                    callback(err);
                }
            });

        }else{
            callback("DB already exist");
        }
    })
};

const getGraphDatabase = function (name, callback) {
    databaseExist(name, function (err, result) {
        if(!err) {
            getOrCreateDB(name, function (err, db) {
                if(!err) {
                    callback(null, levelgraph(db));
                }else{
                    callback(err);
                }
            })
        }else{
            callback("DB not exist");
        }
    })
};

/**
 *
 * Connect Member with Context
 *
 * @param subject       is member id
 * @param predicate     is role
 * @param object        is context id
 * @param callback
 */
const connect = function ({subject, predicate, object, ttl}, callback) {

    if(subject && predicate && object) {
        getGraphDatabase(subject, function (err, gp) {
            if(!err) {
                put(gp, {subject, predicate, object, ttl}, function (err, result) {
                    if(!err) {
                        callback(null, result);
                    }else{
                        callback(err);
                    }
                });
            }else{
                callback(err);
            }
        })
    }else{
        callback("validation error");
    }
};

const put = function (db, data, callback) {
    db.put(
        data, function (err, result) {
            if(!err) {
                db.close();
                callback(null, result);
            }else {
                db.close();
                callback(err)
            }
        }
    )
};

const get = function (db, obj, callback) {
    db.get(obj, function(err, list) {
            if(!err) {
                db.close();
                callback(null, list);
            }else {
                db.close();
                callback(err);
            }
        });
};

const read = function (member, callback) {

    getGraphDatabase(member, function (err, db) {
        if(!err) {
            get(db, { subject: member }, function (err, result) {
                if(!err){
                    callback(null, result);
                }else{
                    callback(err);
                }
            })
        }else{
            callback(err);
        }
    });
};

const getByContext = function (member, context, callback) {
    db.get({subject: member, object: context}, function (err, result) {
        if(!err) {
            callback(null, result);
        }else {
            callback(err, null);
        }
    });
};


module.exports = {
    connect: connect,
    read: read,
    getByContext: getByContext,
    databaseExist: databaseExist,
    createDatabase: createDatabase
};


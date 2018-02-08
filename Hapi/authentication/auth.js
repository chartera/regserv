

var _ = require('lodash');
const Security = require('./Security').security;
const security = new Security("", { salt: "secure" } );

module.exports = function (config) {

    const
        datastore = config.datastore,
        authorization = config.authorization;


    const getAdminContexts = function (token, callback) {
        datastore.get(token, function (err, result) {
            if(!err) {
                callback(null, _.filter(JSON.parse(result), function (cx) {
                    return cx.predicate === "admin";
                }));
            }else{
                callback(err);
            }
        });
    };

    const getToken = function (data) {
        return security.getToken(data);
    };

    const readContextAccess = function (context, token, callback) {
        datastore.get(token, function (err, result) {
            if(!err) {

                const ctxs = JSON.parse(result);
                const obj = _.find(ctxs, function (ctx) {
                    return ctx.object === context;
                });
                if(_.find(ctxs, function (ctx) { return ctx.object === context; })) {
                    callback(null, obj);
                }else {
                    callback(`${context} is not valid for token ${token}`);
                }
            }
        });
    };


    const ownerAccess = function (token, callback) {
        datastore.get(token, function (err, result) {
            if(!err) {
                const ctxs = JSON.parse(result);
                callback(null, _.find(ctxs, function (ctx) {
                    return ctx.predicate === "owner";
                }))
            }else {
                callback("Session not exist");
            }
        });
    };



    const getAuthorization = function (token, callback) {
        datastore.get(token, callback);
    };

    const bindToken = function (token, authorization, callback) {
        datastore.set(token, authorization, callback);
    };

    const updateSession = function (token, member, callback) {

        authorization.push({role:"context",  cmd: "read:allContext", data:{member: member}}, function (err, result) {
            if(!err) {
                const newToken = security.getToken({authorization: result.data});
                console.log("CREATE NEW TOKEN", newToken);
                // TODO: delete old token in cache


                datastore.set(newToken, JSON.stringify(result.data), function (err, result) {
                    if(!err){
                        callback(null, newToken);
                    }else {
                        callback(err);
                    }
                });
            }else {
                console.error("AUTH fatal error"); // TODO
            }
        });
    };

    return {
        getToken: getToken,
        readContextAccess: readContextAccess,
        ownerAccess: ownerAccess,
        bindToken: bindToken,
        getAuthorization: getAuthorization,
        updateSession: updateSession,
        getAdminContexts: getAdminContexts
    }


};
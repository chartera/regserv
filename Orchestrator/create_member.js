/**
 * Created by naeltasmim on 11.04.17.
 */


module.exports = function({helper, tasks: {create_context, confirm_registration}}) {

    const init = function ({contact, password, role = "creator"}, done) {
        const db = `m${helper.getDigits()}_`;
        helper.async.auto({
            confirm_membership: function (callback) {
                confirm_registration.init({username: contact, password}, function (err, result) {
                    if(!err) {
                        callback(null, result);
                    }else{
                        callback(err);
                    }
                })
            },
            create_database: ["confirm_membership", function (member, callback) {
                create_context.init({context: db, context_info: {type: "info",
                        date: new Date()}, username: contact, role},
                    function (err, result) {
                        if(!err) {
                            callback(null, result);
                        }else{
                            callback(err);
                        }
                })
            }]
        }, function (err, {confirm_membership: {flush_authentication: {member} /*,  flush_authorization: {read: {result} } */ },
                         create_database: {flush_context}}) {
            if(!err) {
                done(null, {database: db, member /*, authorization: result */});
            }else{
                done(err);
            }
        })
    };

    return {
        init: init
    }
};

/*global  */
/**
 * Created by naeltasmim on 14.03.17.
 */

module.exports = function (helper, remote) {


    /**
     * Caller Registry:Hapi:member
     * @param creator
     * @param callback
     */
    const create_context = function ({creator}, callback) {
        push("createContext", {creator}, callback);
    };

    /**
     * Caller Context:Hapi:orchestrator.create_creator_context
     * @param context_info
     * @param creator
     * @param callback
     */
    const create_creator_context = function ({context_info, creator}, callback) {
        push("createCreatorContext", {context: `ctx_${helper.getDigits()}`, context_info, creator}, function (err, result) {
            if(!err) {
                callback(null, result["result"]);
            }else{
                callback({result: err});
            }
        });
    };


    const create_mailRegistration = function (email, callback) {
        push("createRegistration", {contact: email, type: "email"}, callback);
    };

    const get_invitation_token = function (code, callback) {
        push("confirmRegistration", {code: code}, callback);
    };

    const confirm_membership = function ({invitation_token, password}, callback) {
        push("confirmMembership", {invitation_token: invitation_token, password: password}, callback);
    };

    const create_member = function ({contact, password}, callback) {
        push("createMember", {contact, password}, callback);
    };

    const push = function (cmd, payload, callback) {
        remote.push(cmd, payload, function(err, response) {
            if(!err) {
                callback(null, response["result"]);
            }else{
                callback({result: err});
            }
        })
    };


    return {
        create_mailRegistration: create_mailRegistration,
        get_invitation_token:  get_invitation_token,
        confirm_membership: confirm_membership,
        create_member: create_member,
        create_creator_context: create_creator_context,
        create_context: create_context
    }
};

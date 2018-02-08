/**
 * Created by naeltasmim on 08.04.17.
 */

module.exports = function (helper) {

    const member_api = "http://babocan.com/" + helper.apis.member_node().api + "/api/v1/member";
    const request = helper.request;


    /**
     * Caller Registry:Hapi:member
     * TODO Security concerns
     * @param contact
     * @param password
     * @param callback
     */
    const create_member_in_member_node = function ({contact, password}, callback) {
        request.post({url: member_api, form: {contact, password}}, function (err, response, body) {
            if(!err) {
                callback(null, body);
            }else{
                callback(err);
            }
        })
    };

    return {
        create_member_in_member_node: create_member_in_member_node
    }
};
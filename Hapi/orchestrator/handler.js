/**
 * Created by naeltasmim on 09.03.17.
 */



const log4js = require('log4js');
const log = log4js.getLogger('hapi.orchestrator.handler on pid ' + process.pid);



module.exports = function ({microservices, helper}) {


    console.log("Authentication hanlder config", helper.apis);



    const NODE = {db: helper.apis.member_node().db, api: helper.apis.member_node().api};

    const createEmailRegistration = function (email, response) {

        microservices.orchestrator_service.create_mailRegistration(email, function (err, result) {
            if(!err) {
                response({status: "ok", result: result}).code(200);
            }else{
                response({status: "error", result: err["result"]}).code(200);
            }
        })
    };

    const getInvitationToken = function (code, response) {
        microservices.orchestrator_service.get_invitation_token(code, function (err, result) {
            if(!err) {
                response({status: "ok", result: result}).code(200);
            }else{
                response({status: "error", result: err["result"]}).code(200);
            }
        });
    };

    const confirmMembership = function ({invitation_token, password}, response) {
        microservices.orchestrator_service.confirm_membership({invitation_token, password}, function (err, result) {
            if(!err) {
                response({status: "ok", result: result}).code(200);
            }else{
                response({status: "error", result: err["result"]}).code(200);
            }
        });
    };

    const createMember = function ({contact, password}, response) {
        microservices.orchestrator_service.create_member({contact, password}, function (err, result) {
            if(!err) {
                result.node = NODE;
                response({status: "ok", result: result}).code(200);
            }else{
                response({status: "error", result: err["result"]}).code(200);
            }
        })
    };


    return {
        createEmailRegistration: createEmailRegistration,
        getInvitationToken: getInvitationToken,
        confirmMembership: confirmMembership,
        createMember: createMember
    }

};
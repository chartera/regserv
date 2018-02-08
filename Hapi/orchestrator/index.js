/**
 * Created by naeltasmim on 09.03.17.
 */


let handler = require('./handler');
const validation = require('./../common/validation')();
function Api(handler) {


    this.exports = [

        {
            config: {
                cors: true
            },
            method:     'POST',
            path:       '/api/v1/registration',
            handler:    function ({payload: {email, type}, params}, response) {
                if(email) {
                    validation.email(email, function (err, result) {
                        if(!err) {
                            handler.createEmailRegistration(email, response);
                        } else{
                            response({status: "error", result: err}).code(200);
                        }
                    });
                }else{
                    response({status: "error", result: {result: "Validation error"}});
                }

            }
        },

        {
            config: {
                cors: true
            },
            method:     'GET',
            path:       '/api/v1/invitation_token/{code}',
            handler:    function ({payload, params: {code}}, response) {
                if(code){
                    handler.getInvitationToken(code, response);
                }else{
                    response({status: "error", result: {result: "Signatur error on hapi"}}).code(401);
                }
            }
        },

        {

            method: 'POST',
            path: "/api/v1/imember",
            handler: function ({payload: {invitation_token, password}}, response) {
                if(invitation_token && password) {
             //       console.log("/api/v1/member", password, invitation_token);
                    handler.confirmMembership({invitation_token, password}, response);
                }else{
                    response({status: "error", result: {result: "Signatur error on hapi"}});
                }
            }
        },

        {
            config: {
                cors: true
            },
            method:     'GET',
            path:       '/api/v1/member',
            handler:    function (request, response) {
                response({status: "ok", result: "Orchestrator Member api"}).code(200);
            }
        },

        {
            config: {
                cors: true
            },
            method:     'POST',
            path:       '/api/v1/member',
            handler:    function ({payload: {contact, password}, params}, response) {
                if(contact && password) {
                    handler.createMember({contact, password}, response);
                }else{
                    response({status: "error", result: "Signatur error hapi {contact, password}"}).code(200);
                }
            }
        }
    ]
}
Api.prototype._exports = function() {
    return this.exports;
};

const failure = function (response, reason) {
    response.reply(reason);
};

exports.register = function(server, options, next) {

    const helper = options.helper.common.load({name: "Member.hapi.orchestrator.handler", type: ""});
    handler = handler({
        microservices: options.microservices,
        helper: helper
    });

    const api     = new Api(handler);
    server.route(api._exports());
    next();
};

exports.register.attributes = { name: 'orchestrator', version: '0.0.1' };
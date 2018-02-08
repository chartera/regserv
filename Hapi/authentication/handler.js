/**
 * Created by nael on 09.09.16.
 */



var log4js = require('log4js');
var log = log4js.getLogger('hapi.authentication.handler on pid ' + process.pid);


module.exports = function (config) {


    //console.log("Authentication hanlder config", config);

    // TODO request Authentication Service instead Post Service
    const authenticate = function(req, reply) {
        console.log("authenticate");
        reply("Authentication").code(200);
    };

    return {
        authenticate: authenticate
    }

};
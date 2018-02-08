/**
 * Created by nael on 09.09.16.
 */


let handler = require('./handler');
let auth = require('./auth');

function Api(handler) {


    this.exports = [

        {
            config: {
                cors: true
            },
            method:     'GET',
            path:       '/api/oauth/token',
            handler:    handler.authenticate
        }

    ]
}
Api.prototype._exports = function() {
    return this.exports;
};

exports.register = function(server, options, next) {
    // for others
    const auth_api = auth({
    });
    server.expose('authentication', auth_api);

    handler = handler(options.microservices);
    const api     = new Api(handler);
    server.route(api._exports());
    next();
};

exports.register.attributes = { name: 'authPlugin', version: '0.0.1' };
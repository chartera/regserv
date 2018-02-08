
var authentication = require('./Authentication');
// var amqp = require('amqplib');
var log4js = require('log4js');
var log = log4js.getLogger('Authentication handler on pid ' + process.pid);


module.exports = function (config, callback) {

    var _authentication, handler, initMq, initAuthenticationApi;

    handler = function (config) {

        this.add( {init:'handler'}, function( args, done ) {
            done();
        });

        this.add({ role:"member",  cmd: "read:authentication"}, function (args, done) {
            _authentication.find(args.member, done);
        });

        this.add({role: "post", cmd: "set:authentication"}, function (args, done) {
            _authentication.create(args.member, function (err, result) {
                !err ? done(null, {status: "ok", result: result}) : done(null, {status: "error", error: err})
            })
        });


        return "handler";
    };


    initAuthenticationApi = function (conn) {
        return authentication(config.authentication)
            .then(function (api) {
                _authentication = api;
                config.seneca.use(handler);
            })
            .catch(function (e) {
                log.error(e);
            });
    };


    return new Promise(function (resolve, reject) {
        initAuthenticationApi()
            .then(function () {
                resolve();
            })
            .catch(function (e) {
                reject(e);
            })
    });
};


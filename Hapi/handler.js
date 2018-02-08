/**
 * Created by naeltasmim on 06.03.17.
 */


const log4js = require('log4js');
const log = log4js.getLogger('hapi von pid ' + process.pid);

const Fs = require('fs');
const Path = require('path');

exports.start = function(config) {

    ///////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////

    const helper = require('./../common/common')(config);

    const _ = helper.common.load({name: "handler", type: ""});

    console.log("Hapi handler start running ...");

    console.log("*************")

    const connection = require('./../common/Connection');
    const microservice = require('./../common/Microservice');
    // Pass components apis, receive connections and connect
    const conn = connection(config);
    const microservices = microservice(conn.connections, config, helper.common);

    console.log("*************")

    ///////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////

    const Inert = require('inert');
    const Hapi = require('hapi');
    const server = new Hapi.Server();
    server.connection(
        {
            port: config.server.port

            /*
             tls: {
             key: Fs.readFileSync(Path.join(__dirname + '/cert', 'server.key')),
             cert: Fs.readFileSync(Path.join(__dirname + '/cert', 'server.crt'))
             }*/
        });

    const options = {
        ops: {
            interval: 1000
        },
        reporters: {
            myConsoleReporter: [{
                module: 'good-squeeze',
                name: 'Squeeze',
                args: [{ log: '*', response: '*' }]
            }, {
                module: 'good-console'
            }, 'stdout'],
            myFileReporter: [{
                module: 'good-squeeze',
                name: 'Squeeze',
                args: [{ ops: '*' }]
            }, {
                module: 'good-squeeze',
                name: 'SafeJson'
            }, {
                module: 'good-file',
                args: ['.log']
            }]
        }
    };

    server.register(
        [
            require('h2o2'),
            Inert,
            {
                register: require('good'),
                options: options
            },

            {
                register: require('./authentication/index'),
                options: {
                    microservices: microservices
                }
            },

            {
                register: require('./orchestrator/index'),
                options: {
                    microservices: microservices,
                    helper: helper
                }
            }
        ],
        function (err) {
            if (err) {
                throw err;
            }
            server.start(function (err) {
                if(err){
                    throw err;
                }
                console.log('Server running at and pid:', server.info.uri + " "+  process.pid);
            });
        }
    );
// Available in route handlers context
    server.bind({
        usefulApis      : "",
        usefulModules   : ""
    });
};
/**
 * Created by nael on 09.09.16.
 */

/*
  A microservice (also called global microservice) with parallel (multiple processing) execution of his
  components (also called local microservice).
  The member microservice used

  different main components:
    - Rest: form global microservice communication
    - Authentication
    - Authorization
    - Context
    - Orchestrator

  and helper common components:
    - Connection
      - Outbound: for local microservice communication
        - Zmq push, pull and req ipc channels
    - Local microservice apis


  Invoke handler.start of the Rest component and pass a configuration map.
  This map contains apis and settings to the other components of the microservice.
 */

require('dotenv').config();

let hapi_port = process.env.hapi_port;
let singleMode = process.env.singleMode;
let redis_host = process.env.redis_host;
let redis_port = process.env.redis_port;
let psql_host = process.env.psql_host;
let psql_port = process.env.psql_port;


if(singleMode === "true"){

    /*
      In single mode: load handler pass him configuration and get cmd map from handler as return.
      Than load singleMode and pass him the cmd map and get as return handle.
      Outbound know that in singleMode he must call api.handle
    */
    var contextSingleMode = require('./../common/singleMode')(require('./../Context/handler')({
        redis: {
            host: redis_host,
            port: redis_port,
            namespace: "node_m:service:context:"
        },
        couchdb: {
            host: "http://admin:abc@192.168.33.12:5984",
            namespace: "org.couchdb.user"
        }
    }));

    var authorizationSingleMode = require('./../common/singleMode')(require('./../Authorization/handler')({
        redis: {
            host: redis_host,
            port: redis_port,
            namespace: "node_m:service:authorization:"
        }
    }));

    var authenticationSingleMode = require('./../common/singleMode')(require('./../Authentication/handler')({
        redis: {
            host: redis_host,
            port: redis_port,
            namespace: "node_m:service:authentication:"
        },
        authentication: {
            host: psql_host,
            port: psql_port,
            database: "postgres",
            user: "postgres",
            password: "postgres"
        }
    }));

    var orchestratorSingleMode = require('./../common/singleMode')(require('./../Orchestrator/handler')({

        singleMode: singleMode,
        service: "orchestrator",
        redis: {
            host: redis_host,
            port: redis_port,
            namespace: "node_m:service:orchestrator:"
        },
        postgres: {
            host: psql_host,
            port: psql_port,
            database: "postgres",
            user: "postgres",
            password: "postgres"
        },

        context: {
            name: "context",
            api: contextSingleMode
        },
        authorization: {
            name: "authorization",
            api: authorizationSingleMode
        },
        authentication: {
            name: "authentication",
            api: authenticationSingleMode
        }
    }));
}else{
}

const Hapi = require('./handler').start({
    system: {
        __dirname: __dirname
    },
    service: "hapi",

    server: {
        port: hapi_port
    },

    singleMode: singleMode,

    redis: {
        host: redis_host,
        port: redis_port,
        namespace: "node_m:service:hapi:"
    },

    context: {
        name: "context",
        handshake: "ipc://context-rep.ipc",  // send handshake to this address
        api: singleMode === "true" ? contextSingleMode : "ipc://context-puller.ipc", // send msgs to this address
        timeout: 95000
    },
    authorization: {
        name: "authorization",
        handshake: "ipc://authorization-rep.ipc",
        api: singleMode === "true" ?  authorizationSingleMode : "ipc://authorization-puller.ipc",
        timeout: 95000,
        user_namespace: "org.couchdb.user"
    },
    authentication: {
        name: "authentication",
        handshake: "ipc://authentication-rep.ipc",
        api: singleMode === "true" ? authenticationSingleMode : "ipc://authentication-puller.ipc",
        timeout: 95000
    } ,
    orchestrator: {
        name: "orchestrator",
        handshake: "ipc://orchestrator-rep.ipc",
        api: singleMode === "true" ? orchestratorSingleMode : "ipc://orchestrator-puller.ipc",
        timeout: 95000
    }


});






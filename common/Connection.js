const log4js = require('log4js');
const shell = require('shelljs');
const outbound = require('./Outbound');
const Redis = require('ioredis');
require('dotenv').config();

let root_path = process.env.root_path;

module.exports = function(config){

  const connect_redis = function(config) {
    const log =
      log4js.getLogger(`Orchestrator.chache on pid ${process.pid}`);


    const redis = new Redis({
        host: config.host,
        port: config.port,
        keyPrefix: config.namespace
    });
    redis.on('reconnecting', function (time) {
        log.info(`Redis reconnect ${time}`);
    });
    redis.on('error', function (time) {
        log.info(`Redis error ${time}`);
    });
    redis.on('connect', function () {
        log.info(`Redis connect `);

    });
    return redis;
  };

  const connect_service = function({name, handshake, api, timeout}) {


      const log =
          log4js.getLogger(`${config.service}.${name} on pid ${process.pid}`);

      console.log("   ", config.service);
      if(config["singleMode"] === "true") {

          const remote = new outbound({
              singleMode: "true",
              name: `${name}Service`,
              callbackAddress: "singleMode",
              handshakeAddress: "singleMode",
              api: api,
              timeout: "singleMode"
          }, function (err, result) {
              err ? log.error(err) : log.info(result);
          });

          return remote;

      }else{
          let ipc_channel = `ipc://${config.service}-pull-channel-for-${name}-${process.pid}.ipc`; // to much channels!!!! TODO
          // Remove ipc channel, it already exist after partial update
          shell.exec(`rm ${config.service}-pull-channel-for-${name}*`);
          const remote = new outbound({
              singleMode: "false",
              name: `${name}Service`,
              callbackAddress: ipc_channel,
              handshakeAddress: handshake,
              api: api,
              timeout: timeout
          }, function (err, result) {
              err ? log.error(err) : log.info(result);
          });
          remote.handshake();
          return remote;
      }

   };

  const connect = function (config) {
      connections.set(config,
          connect_service(config));
      return connections;
  };

  const connections = new WeakMap();

  // TODO to much channels !!! bug

  if(config["context"]){
      connections.set(config.context,
          connect_service(config.context));
  }
  if(config["authorization"]){
      connections.set(config.authorization,
          connect_service(config.authorization));
  }
  if(config["authentication"]) {
      connections.set(config.authentication,
          connect_service(config.authentication));
  }
  if(config["orchestrator"]){
      connections.set(config.orchestrator,
          connect_service(config.orchestrator));
  }

  if(config["redis"]){
      connections.set(config.redis,
          connect_redis(config.redis));
  }


  return {
      connections: connections,
      connect: connect
  };
};

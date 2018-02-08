const log4js = require('log4js');
const jwt = require('jsonwebtoken');
const request = require('request');
const salt = "secure";
module.exports = function (config) {

const destruct_service_msg = function(service, {status, result}, callback) {
  switch (status) {
    case "ok":
      callback(null, result);
      break;
    case "error":
      callback({ service: service, error: result});
      break;
    case "flush":
      callback(null, result);
      break;
    default:
      break;
  }
};

const createToken = function(payload) {
    return jwt.sign(payload, salt);
};

const decodeToken = function(token, callback){
    return jwt.verify(token, salt, callback);
};

 const load = function(_config) {
   const validation =
     require('./validation')(
       {origin: `${config.service}.${_config.name}_${_config.type}`});
   const log =
     log4js.getLogger(`${config.service}.${_config.name} on pid ${process.pid}`);
   const getDigits = () => Math.floor(Math.random()* 900000) + 100000;
   const async = require('async');
   return {
       validation: validation,
       log: log,
       async: async,
       getDigits: getDigits,
       destruct_service_msg: destruct_service_msg,
       createToken: createToken,
       decodeToken: decodeToken,
       request: request,
       apis: {
           member_node: function () {
               return {
                   api: "m1",
                   db: "mc1"
               }
           },
           context_node: function () {
               return {
                   api: "ctx1",
                   db: "ctxc1",
		   ws: "/socketcluster1/"
               }
           }
       }
   }
 };
  return {
    common: {
      load: load
    }
  }
};

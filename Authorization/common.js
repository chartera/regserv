const outbound = require('./Outbound');
const log4js = require('log4js');
const shortid = require('shortid');
module.exports = function () {

 const load = function(config) {
   const validation =
     require('./validation')({origin: `Authorization.${config.name}_${config.type}`});
   const log =
     log4js.getLogger(`Authorization.${config.name} on pid ${process.pid}`);
   const getDigits = () => Math.floor(Math.random()* 900000) + 100000;
   const async = require('async');
   return {
     validation: validation,
     log: log,
     async: async,
     getDigits: getDigits,
     shortid: shortid,
     callback: function (err, result) {
         if(!err){
             this(null, result);
         }else{
             this(err);
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

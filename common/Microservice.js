module.exports = function(connections, address, helper){

  const return_object = {};

  if(connections.get(address.redis)) {
      const cache_service = require('./Cache_service')(helper.load({
          name: "cache", type: "service"}), connections.get(address.redis));
      return_object.cache_service = cache_service;
  }

  if(connections.get(address.context)){
      const context_service = require('./Context_service')(helper.load({
          name: "context", type: "service"}), connections.get(address.context));
      return_object.context_service = context_service;
  }

  if(connections.get(address.authorization)){
      const authorization_service = require('./Authorization_service')
      (helper.load({ name: "authorization", type: "service"}),
          connections.get(address.authorization), address.authorization);
      return_object.authorization_service = authorization_service;
  }

  if(connections.get(address.authentication)){
      const authentication_service = require('./Authentication_service')
      (helper.load({name: "authentication", type: "service"}),
          connections.get(address.authentication));
      return_object.authentication_service = authentication_service;
  }


  const member_service = require('./Member_service')
    (helper.load({name: "member", type: "service"}));
    return_object.member_service = member_service;


  const orchestrator_address = address["orchestrator"];
  if(orchestrator_address && connections.get(orchestrator_address)) {
      const orchestrator_service = require('./Orchestrator_service')
      (helper.load({name: "orchestrator", type: "service"}),
          connections.get(orchestrator_address));

      return_object.orchestrator_service = orchestrator_service;

  }


  return return_object;
};

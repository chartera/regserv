module.exports = function(microservices, helper){

  const create_registration = require('./create_registration')({
    helper: helper.load({name: "create", type: "registration"}),
    cache: microservices.cache_service,
    authentication: microservices.authentication_service
  });

  const confirm_registration = require('./confirm_registration')({
    helper: helper.load({name: "confirm", type: "registration"}),
    cache: microservices.cache_service,
    context: microservices.context_service,
    authorization: microservices.authorization_service,
    authentication: microservices.authentication_service
  });

  const create_context = require('./create_context')({
    helper: helper.load({ name: "create", type: "context"}),
    context: microservices.context_service,
    authorization: microservices.authorization_service
  });

  const create_member = require('./create_member')({
      helper: helper.load({ name: "create", type: "member"}),
      tasks: {
          create_context: create_context,
          confirm_registration: confirm_registration
      }
  });


  return {
      create_context: create_context,
      create_registration: create_registration,
      confirm_registration: confirm_registration,
      create_member: create_member
  }

};

module.exports = function(config){

  const helper = require('./../common/common')(config);
  const $ = helper.common.load({name: "handler", type: ""});

    console.log("Orchestrator handler start running ...")


    const connection = require('./../common/Connection');
  const microservice = require('./../common/Microservice');

  const task = require('./Task');

  // Microservice connections
  const conn = connection(config);
  // Microservice Apis
  const microservices = microservice(conn.connections, config, helper.common);
  // Business tasks
  const tasks = task(microservices, helper.common);



/*
* CMD's
*/
  // return code
  const createRegistration = function({contact, type} = {}, callback){
    if( (contact && type)  && (type === "email" || type === "phone")) {
        // TODO mail || password
        tasks.create_registration.init({username: contact}, function(err, result) {
            if(!err){
              callback(null, {status: "ok", result: result});
            }else{
              callback({status: "error", result: err});
            }
        });
    }else{
      callback($.validation.signatur_error(arguments[0],
        "{contact, type: email||phone}"))
    }

  };
  // return invitation_token
  const confirmRegistration = function({code}, callback) {
    if(code) {
      tasks.confirm_registration.getInvitationToken({code}, function(err, result) {
        if(!err) {
          callback(null, {status: "ok", result: result});
        }else{
          callback({status: "error", result: err});
        }
      })
    }else{
      callback($.validation.signatur_error(arguments[0],
        "{code}"));
    }
  };





  const confirmMembership = function ({username, password}, callback) {
        if(username && password) {
            tasks.confirm_registration.init({username, password}, function(err, result) {
                if(!err) {
                    callback(null, {status: "ok", result: result});
                }else{
                    callback({status: "error", result: err});
                }
            })
        }else{
            callback($.validation.signatur_error(arguments[0],
                "{code}"));
        }
    };
  const createContext = function ({context, context_info, username, role = "creator"} = {}, callback) {
      if( (context && context_info && username && role === "creator") &&  (context_info["type"] === "info") ) {
          tasks.create_context.init({context, context_info, username, role}, function(err, result) {
              if(!err){
                  callback(null, {status: "ok", result: result});
              } else{
                  callback({status: "error", result: err});
              }
          });
      } else{
          callback($.validation.signatur_error(arguments[0],
              "{context, context_info, username, role: creator}"));
      }
  };
  // TODO: Protect api called from registry
  const createMember = function ({contact, password}, callback) {
      tasks.create_member.init({contact, password}, function (err, result) {
          if(!err){
              callback(null, {status: "ok", result: result});
          }else{
              callback(err);
          }
      });
  };



  const notImpl = function (args, callback) {
      callback({status: "error", error: "Not implemented"});
  };
  return new Map([
      ["flush", notImpl],
      ["createContext", createContext],
      ["createRegistration", createRegistration],
      ["confirmMembership", confirmMembership],
      ["confirmRegistration", confirmRegistration],
      ["createMember", createMember],
      ["ping", function (data, callback) {
          console.log("PING", data);
      }]
  ]);

};


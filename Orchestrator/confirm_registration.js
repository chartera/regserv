/*
  * Fetch registration data from cache,
  * ask services for creating data,
  * flushing
  *   Services:
  *     - Context
  *     - Authentication
  *     - Authorization
  *     - Cache
  *   Requirement:
  *     - Critical error handling by flushing TODO -> see flush
  */
module.exports = function (modules) {

  const ask = function({username, password}, finish) {

    modules.helper.async.auto({
      create_user: function(callback) {
        modules.context.create_user({username, password}, function(err, result){
            console.log("modules.context.create_user", err || result);
          if(!err) {
              modules.helper.destruct_service_msg("context", result, callback);
          }else{
            callback(err);
          }
        })
      },
      create_authentication: function(callback) {
        modules.authentication.create({member: username, password}, function(err, result){
          if(!err){
              modules.helper.destruct_service_msg("authentication", result, callback);
          }else{
            callback(err);
          }
        })
      } /* ,
      create_authorization: function(callback) {

        modules.authorization.create_connect({name: username, predicate: "owner", object:
          {type: "user", value: username}}, function(err, result){
          if(!err){
              modules.helper.destruct_service_msg("authorization", result, callback);
          }else{
            callback(err);
          }
        })
      } */
    }, function(err, {
     //  create_authorization: authorization,
      create_authentication: authentication,
      create_user: user
    }) {
      if(!err) {
        finish(null, { /* authorization, */ authentication, user});
      }else{
        finish(err);
      }
    })
  };

  const flush = function({/* authorization, */ authentication, user}, end) {

    modules.helper.async.auto({
/*      flush_authorization: function(callback) {
          modules.authorization.flush(authorization, function(err, result) {
            if(!err){
              modules.helper.destruct_service_msg("authorization", result, callback);
            }else{
              callback(err);
            }
          })
      }, */

      flush_authentication: function(callback) {
        modules.authentication.flush(authentication, function(err, result){
          if(!err) {
              modules.helper.destruct_service_msg("authentication", result, callback);
          }else{
            callback(err);
          }
        });
      },

      flush_context: function(callback) {
        modules.context.flush(user, function(err, result) {
          if(!err) {
            modules.helper.destruct_service_msg("context", result, callback);
          }else{
            callback(err);
          }
        });
      }

    }, function(err, result) {
      if(!err){
        end(null, result);
      }else{
        end(err); // TODO Critical

      }
    });
  };


  const getInvitationToken = function ({code}, callback) {
      modules.cache.get(code, function (err, {username} = {}) {
          if(!err && username) {
              modules.cache.setExpire(code, {username}, 1, (x, y) => {});

              const invitation_token = modules.helper.createToken({username});
              modules.cache.setExpire(invitation_token, {username}, 1000, (err, result) => {
                  if(!err) {
                      callback(null, {invitation_token: invitation_token});
                  }else {
                      callback(err)
                  }
              })
          }else{
              callback("Code not exist");
          }
      });
  };

  const init =  function({username, password}, callback){
      ask({username, password}, function(err, result){
          if(!err){
              flush(result, callback);
          }else{
              callback(err);
          }
      });
  };

  return {
      init: init,
      getInvitationToken: getInvitationToken
  }
};


/*
  * Create an new context for existed user
  *   Services:
  *     - Context
  *     - Authorization
  *   Requirement:
  *     - Auto created id as context TODO
  *     - Authorization for user must be already exist
  *     - Critical error handling by flushing TODO -> see flush
  *     - Handling err:DB_CON_FAIL TODO
  */

module.exports = function(modules) {

  const ask = function({context, context_info, username, role} = {}, finish) {
    modules.helper.async.auto({
      create_context: function(callback) {
        modules.context.create_context({context, context_info, username},
          function(err,  result) {
            if(!err) {
              modules.helper.destruct_service_msg("context", result, callback);
            }else{
              callback(err);
            }
        });
      } /*,
      connect_authorization: function(callback) {
        modules.authorization.connect({admin: username, role, context},
          function(err, result) {
            if(!err) {
              modules.helper.destruct_service_msg("authorization", result, callback);
            }else{
              callback(err);
            }
          });
      }*/
    }, function(err, {
//      connect_authorization: authorization,
      create_context: context
    }) {
        if(!err){
          finish(null, {
            context: context /*,
            authorization: authorization */
          });
        }else{
          finish(err);
        }
    });
  };

  const flush = function({context /*, authorization */}, end) {
      modules.helper.async.auto({
        flush_context: function(callback) {
            modules.context.flush(context, function(err, result) {
              if(!err) {
                modules.helper.destruct_service_msg("context", result, callback);
              }else{
                callback(err);
              }
            });
        } /*,
        flush_authorization: function(callback) {
          modules.authorization.flush(authorization, function(err, result) {
            if(!err){
              modules.helper.destruct_service_msg("authorization", result, callback);
            }else{
              callback(err);
            }
          });
        }*/
      }, function(err, result) {
          if(!err){
            end(null, result);
          }else{
            end(err); // TODO Critical
          }
      });
  };

  const init = function({context, context_info, username, role} = {}, finish){
      
    ask(arguments[0], function(err, result) {

      if(!err) {
        flush(result, finish);
      }else{
        finish(err);
      }
    });
  };


  return {
    init: init
  };
};

module.exports = function (helper, remote) {


    const context_api = "http://babocan.com/" + helper.apis.context_node().api + "/api/v1/ctx";
    const request = helper.request;

    /**
     * Caller Registry:Hapi:context
     * Todo Security concerns
     */
    const create_context_in_context_node = function ({creator: {contact, password_hash, category_id}}, callback) {
        request.post({url: context_api, form: {
            contact: contact,
            password_hash: password_hash,
            category_id: category_id
        }}, function (err, response, body) {
            if(!err) {
                callback(null, body);
            }else{
                callback(err);
            }
        })
    };

    const create_context = function({context, context_info, username} = {}, callback ) {
    if( (context && context_info && username) && (context_info["type"] === "info") ) {
      remote.push("createContext", {context, context_info, username}, function(err, result) {
        if(!err) {
          callback(null, result);
        }else{
          callback({service: "context", result: err});
        }
      })
    }else{
      callback(helper.validation.signatur_error(arguments[0], "{context, context_info: {type: info}, admin}"));
    }
  };

    /**
     * Caller Context:Orchestrator:handler.createCreatorContext
     * @param context
     * @param context_info
     * @param creator
     * @param callback
     */
    const create_creator_context = function ({context, context_info, creator}, callback) {
        push("createCreatorContext", {context, context_info, creator}, callback);
    };

    const create_user = function({username, password}, callback){
    if(username && password) {
      remote.push("createUser", {username, password}, function(err, result) {
        if(!err) {
          callback(null, result);
        }else{
          callback({service: "context", result: err});
        }
      })
    }else{
      callback(helper.validation.signatur_error(arguments[0], "{username, password}"));
    }
  };

    const get_document = function ({database, doc_id}, callback) {
      if(database && doc_id) {
        push("getDocument", {database, doc_id}, callback)
      }else{
        callback(helper.validation.signatur_error(arguments[0], "{database, doc_id}"));
      }
  };

    const post_document = function ({database, doc}, callback) {
      if(database && doc) {
        push("postDocument", {database, doc}, callback);
      }else{
          callback(helper.validation.signatur_error(arguments[0], "{database, doc}"));
      }
  };


    const push = function(cmd, msg, callback) {
      remote.push(cmd, msg, function(err, result){
          if(!err) {
              callback(null, result);
          }else{
              callback({service: "context", result: err});
          }
      });
  };


    const flush = function(id, callback) {
    remote.push("flush", id, function(err, result) {
      if(!err) {
        callback(null, result);
      }else{
        callback({service: "context", result: err});
      }
    })
  };

    return {
        post_document: post_document,
        create_context: create_context,
        get_document: get_document,
        create_user: create_user,
        create_context_in_context_node: create_context_in_context_node,
        create_creator_context: create_creator_context,
        flush: flush
  }
};

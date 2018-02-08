module.exports = function (helper, remote, config) {

  /*
  *   Create authorization by name and connect name with object as owner
  */
  const create_connect = function({name, predicate, object: {type, value} = {} }, callback) {

    if(type && value) {
      if(type === "user") {
        push("create_connect", {name, predicate, object: `${config.user_namespace}:${value}`}, callback);
      }else if(type === "context") {
          push("create_connect", {name, predicate, object: value}, callback);
      }else{
        callback({service: "authorization", result: "object type error"});
      }
    }else{
      callback({service: "authorization", result: "object type or value not defined"});
    }
  };

  const connect = function({admin: subject, role: predicate, context: object}, callback) {
    remote.push("connect", {subject, predicate, object}, function(err, result){
      if(!err) {
        callback(null, result);
      }else{
        callback({service: "authorization", result: err});
      }
    })
  };

    /**
     * Caller Registry:Orchestrator:task:create_context over Registry:Orchestrator:handler.createContext
     * @param subject
     * @param predicate
     * @param object
     * @param ttl
     * @param callback
     */
  const connect_read = function ({subject, predicate, object, ttl}, callback) {
      push("connect_read", {subject, predicate, object, ttl}, callback);
  };

  const database_exist = function ({database}, callback) {
    push("databaseExist", {database}, callback);
  };

  const push = function(cmd, msg, callback) {
        remote.push(cmd, msg, function(err, result){
            if(!err) {
                callback(null, result);
            }else{
                callback({service: "authorization", result: err});
            }
        });
    };

  const flush = function(id, callback) {
    remote.push("flush", id, function(err, result) {
              console.log("!!!", result || err);
      if(!err) {
        callback(null, result);
      }else{
        callback({service: "authorization", result: err});
      }
    })
  };


  return {
      connect:connect,
      flush: flush,
      create_connect: create_connect,
      database_exist: database_exist,
      connect_read: connect_read
  }
};

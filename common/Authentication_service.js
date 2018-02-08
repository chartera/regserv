module.exports = function(helper, remote){


  const create = function({member, password}, callback){
    remote.push("create", {member, password}, function(err, result) {
      if(!err) {
        callback(null, result);
      } else{
        callback({service: "authentication", result: err});
      }
    });
  };

  const getMember = function({member}, callback) {
    remote.push("read", {member}, function(err, result) {
      if(!err) {
        if(result["status"] === "ok") {
          callback(null, result["result"]);
        }else if(result["status"] === "error"){
          callback(result["result"]);
        }
      }else{
        callback({service: "authentication", result: err});
      }
    })
  };

  const hashPassword = function({password}, callback) {
    remote.push("hashPassword", {password}, function(err, hashing) {
      if(!err) {
        if(hashing["status"] === "ok") {
          callback(null, hashing["result"]);
        }else{
          callback("Authentication hashing error");
        }
      }else{
        callback({service: "authentication", result: err || "Hashon error"});
      }
    });
  };

  const flush = function(id, callback) {
    remote.push("flush", id, function(err, result) {
      if(!err) {
        callback(null, result);
      }else{
        callback({service: "authentication", result: err});
      }
    });
  };

  return {
    create: create,
    flush: flush,
    hashPassword: hashPassword,
    getMember: getMember
  }
}

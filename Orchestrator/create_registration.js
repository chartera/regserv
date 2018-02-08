
/*
  * Set registration data to cache wiht ttl until confirmation
  *   Services:
  *     - Cache
  *     - Mail
  *   Requirement:
  *     - Check cache available TODO
  *     - Check username unique in system
  *     - block username after put in cache TODO
  */
module.exports = function(modules) {

  let ttl = 20120;
  const _getDigits = () => Math.floor(Math.random()* 900000) + 100000;

  const setRegistration = (data, callback) => {
      const stateMap = {};
      modules.helper.async.series([
          (callback) => {
              const code = _getDigits();
              modules.cache.checkKey(code, (err, result) => {
                  if(!err && Object.keys(result).length === 0) {
                      stateMap.code  = code;
                      callback(null, {uniqueness : true});
                  }else if(!err && Object.keys(result).length > 0) { // code not uniqueness
                      callback({error: "logic", uniqueness : false});
                  } else {
                      callback({error: "system", msg: err});
                  }
              });
          },
          (callback) => {
              modules.cache.setExpire(stateMap.code, data, ttl, (err, result) => {
                  if(!err) {
                      callback(null, {setRegistration: true});
                  }else {
                      callback({error: "system", msg: err, setRegistration: false})
                  }
              })
          }
      ], (err, result) => {
          if(!err) {
              return callback(null, stateMap.code);
          } else {
              if(err.error === "logic") {
                  return setRegistration(data, callback);
              }else if(err.error === "system") {
                  return callback(err);
              }
          }
      })
  };

  const hashPassword = function({password}, callback) {
    modules.authentication.hashPassword({password}, function(err, result) {
      if(!err) {
        callback(null, result);
      }else{
        callback(err);
      }
    });
  };

  const getMember = function({member}, callback) {
    modules.authentication.getMember({member}, function(err, result) {
      if(err) {
        callback("Not exist");
      }else{
        callback(null, result);
      }
    });
  };

  const init = function({username}, callback){
    getMember({member: username}, function(err, result) {
        if(err) {
            setRegistration({username}, callback);
        }else{
            callback("Already exist");
        }
    })
  };


  return {
    init: init
  };
};

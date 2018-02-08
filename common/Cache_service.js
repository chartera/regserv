
const log4js = require('log4js');

function Redis(redis) {

    this.client = redis;

}

Redis.prototype.getClient = function() {
    return this.client;
};


Redis.prototype.set = function (key, fields, callback) {


    this.getClient().hmset(key, fields, function(err, result) {
        if(err) {
            callback(err, null);
        } else {

            callback(null, result);
        }
    });

};


Redis.prototype.get = function(key, callback){

    this.getClient().hgetall(key, function(err, result) {
        if(err) {
            callback(err);
        }else {
            callback(null, result);
        }
    });
};

Redis.prototype.del = function(key, callback){

    this.getClient().del(key, function(err, result) {
        if(err) {
            console.log(err, null);
        }else {
            callback(null, result);
        }
    });
};


Redis.prototype.set_expire_get = function(key, data, ttl, callback) {

    var pipeline = this.getClient().pipeline();
    pipeline.hmset(key, data).expire(key, ttl).hgetall(key).exec(function(err, result) {
        if(err) {
            callback(err, null);
        } else {

            callback(null, result);
        }
    });

};

module.exports = function (helper, redis) {

  const datastore = new Redis(redis);
  const checkKey = (key, callback) => {
      datastore.get(key, function (err, result) {
          err ? callback(err) : callback(null, result);
      });
  };

  const setExpire = function(key, data, ttl, callback) {
    datastore.set_expire_get(key, data, ttl, callback);
  };

  const get = function(key, callback) {
    datastore.get(key, (err, result) => {
      console.log("chache get", key);
        if(!err && result) {
            callback(null, result);
        }else{
          callback(err);
        }
    });
  };

  return {
    test : (task) => console.log(`Cache_service available from ${task}`),
    checkKey: checkKey,
    setExpire: setExpire,
    get: get
  }
};

var log4js = require('log4js');
var zmq = require('zmq');
var log = log4js.getLogger('Orchestrator.Outbound on pid ' + process.pid);


var Outbound = function (config, callback) {
    this.timeout = config.timeout;
    this.pusher = zmq.socket('push');
    this.clients = zmq.socket('pull');
    this.requester = zmq.socket('req');
    this.name = config.name;
    this.key = config.key;
    var that = this;
    this.callbackAddress = config.callbackAddress;
    this.handshakeAddress = config.handshakeAddress;
    this.api = config.api;
    this.id = 0;
    this.responseMap = {};
    this.clients.bind(this.callbackAddress, function (err) {
        !err ? log.info("Pull channel is now open on " + that.callbackAddress) : log.error(err);
    });

    this.clients.on('message', function (data) {
        config.pull ? config.pull(data) : that.pull(data);
    });

    this.requester.connect(this.handshakeAddress);

    this.requester.on('message', function (response) {
        try{
            var res = JSON.parse(response);
            log.info(that.handshakeAddress,res);
            if(res["type"] === "handshake" || res["channel"] === "open" ) {
                that.pusher.connect(that.api);
                callback(null, "Successful connection to " + that.name);
            } else {
                callback("Handshake error");
            }
        }catch(e) {
            callback(e);
        }
    });

};

Outbound.prototype.handshake = function () {
    this.requester.send(JSON.stringify({
        key: this.key,
        origin: this.callbackAddress
    }));
};
// TODO: use weakmap
Outbound.prototype.pull = function (data) {
    try{
        log.info("PULL message from ", this.name);
        data = JSON.parse(data);
        const id = data[0]["id"];
        const callback = this.responseMap[id];
        this.responseMap[id](null, data[1]);
        /*
        if(callback["promise"]){
          callback.resolve(data[1]);
        }else{
          this.responseMap[id](null, data[1]);
        }*/

        delete this.responseMap[id];
    }catch(error) {
        log.error(error);
    }
};
// TODO : check args
Outbound.prototype.push = function (cmd, args, callback) {
  if( (cmd && args) ){
    var _id = this.id++;
    var er = [];
    er[0] = {};
    er[0].id = _id;
    er[0].origin = this.callbackAddress;
    er[1] = cmd;
    er[2] = args;

    this.responseMap[_id] = callback;
    this.pusher.send(JSON.stringify(er));
    setTimeout(() => {
      if(this.responseMap[_id]) {
        callback(`${this.name} timeout`);
        log.error(`${this.name} timeout`);
        delete this.responseMap[_id];
      }else{
        log.info(`Request evaluate with response. ResponseMap state: ${JSON.stringify(this.responseMap)}`);
      }
    }, this.timeout);

    /*
    if(!callback) {
      const deferred = {};
      const promise = new Promise(function(resolve, reject) {
        deferred.resolve = resolve;
        deferred.reject  = reject;
      });
      deferred.promise = promise;
      this.responseMap[_id] = deferred;
      this.pusher.send(JSON.stringify(er));
      setTimeout(() => {
        if(this.responseMap[_id]) {
          deferred.reject("ContextService timeout");
          delete this.responseMap[_id];
        }else{
          log.info(`Request evaluate with response. ResponseMap state: ${JSON.stringify(this.responseMap)}`);
        }
      }, this.timeout);
      return deferred.promise;

    }else{
      this.responseMap[_id] = callback;
      this.pusher.send(JSON.stringify(er));
    }*/

  }else{
      log.error("Arguments error");
  }
};

module.exports = Outbound;

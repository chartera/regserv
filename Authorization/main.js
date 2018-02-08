require('dotenv').config();
let singleMode = process.env.singleMode;
let redis_host = process.env.redis_host;
let redis_port = process.env.redis_port;

if(singleMode === "true"){
    console.log("Authorization is in singleMode");
}else{
    const
        cluster = require('cluster'),
        zmq = require('zmq'),
        log4js = require('log4js'),
        log = log4js.getLogger('Authorizationn.main on pid: ' + process.pid);

    if (cluster.isMaster) {


        let
            clients = {},
            handshake = zmq.socket("rep").bind('ipc://authorization-rep.ipc'),     // message for initialize back channel
            router_in = zmq.socket('pull').bind('ipc://authorization-puller.ipc'),            // message for jobs

            toWorker = zmq.socket('push').bind('ipc://_authorization-pusher.ipc'),   // send jobs to Worker
            fromWorker = zmq.socket('pull').bind('ipc://_authorization-puller.ipc'); // receive job response


        handshake.on("message", function (message) {
            try{
                const data = JSON.parse(message);

                if(! clients[data["origin"]] ) {
                    // connectToOrigin(data["origin"]);
                    log.info("Master connected to ", data["origin"]);
                } else {
                    log.info("Master reconnected to ", data["origin"]);
                }
                handshake.send(JSON.stringify({
                    type: "handshake",
                    handshake: true
                }))
            }catch(e){
                handshake.send(JSON.stringify({
                    channel: "close",
                    msg: e
                }));
                log.error(e);
            }
        });

        router_in.on('message', function (msg) {
            log.info("Master receive message");
            toWorker.send(msg);
        });

        // listen for worker messages
        fromWorker.on('message', function(message) {

        });


        for (let i = 0; i < 3; i++) {
            cluster.fork();
        }
        // listen for workers to come online
        cluster.on('online', function(worker) {
            log.info('Worker is online.');
        });

    } else {

        let
            fromRouter = zmq.socket('pull').connect("ipc://_authorization-pusher.ipc"),
            toRouter = zmq.socket('push').connect("ipc://_authorization-puller.ipc"),
            map = require('./handler')({
                redis: {
                    host: redis_host,
                    port: redis_port,
                    namespace: "node_m:service:authorization:"
                }
            }),
            clients = {},

            connectToOrigin = function (origin, callback) {
                clients[origin] = zmq.socket('push').connect(origin);
                callback ? callback() : "" ;
            },

            send = function (data) {

                const origin = data[0]["origin"];
                data[0]["origin"] = "ipc://authorization-puller.ipc";

                if(clients[origin]) {
                    log.info("Send message to client ", origin);
                    clients[origin].send(JSON.stringify(data))
                }else {
                    connectToOrigin(origin, function () {
                        log.info("Connect and send message to client ", origin);
                        clients[origin].send(JSON.stringify(data));
                    });
                }
            },

            error = function (header, err) {
                // toRouter.send(JSON.stringify([header, err]));
                send([header, err]);
            },
            response = function (header, payload) {
                //  toRouter.send(JSON.stringify([header, payload]));
                send([header, payload]);
            };

        fromRouter.on('message', function(message) {
            try{
                // ["{header}", "cmd", "{args}"]
                let data    = JSON.parse(message);
                let header  = data[0];
                let cmd     = data[1];
                let args    = data[2];
                if(map.has(cmd)) {
                    map.get(cmd)(args, function (err, result) {
                        err ? error(header, err) : response(header, result);
                    })
                }else{
                    response(header, {status: "error", error: "Authorization found no cmd"});
                }
            }catch(e){
                log.error(e);
            }
        });

    }

}
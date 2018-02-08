
module.exports = function (handler) {

    return {
        handle: function (msg, callback) {
            let data = JSON.parse(msg);
            let header = data[0];
            let cmd = data[1];
            let args = data[2];

            if(handler.has(cmd)){
                handler.get(cmd)(args, function (err, result) {
                    if(err){
                        callback(err);
                    }else{
                        callback(null, result)
                    }
                })
            }else{
                callback([header, "No cmd"])
            }
        }
    }
};
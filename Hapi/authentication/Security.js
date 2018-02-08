
const jwt = require('jsonwebtoken');


function Security(clientCert, secure){

    this.secure = {};
    this.secure.algorithm = secure.algorithm;
    this.secure.salt = secure.salt;

}
Security.prototype.getToken = function(payload) {
    return jwt.sign(payload, this.secure.salt);
};

Security.prototype.decodeToken = function(token, callback){
    return jwt.verify(token, this.secure.salt, callback);
};

exports.security = Security;
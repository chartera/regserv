
const log4js = require('log4js');
const log = log4js.getLogger('Auth.Authentication on pid ' + process.pid);

const Sequelize = require('sequelize');
module.exports = function (config) {

    let sequelize = new Sequelize(config.database, config.user, config.password, {
        host: config.host,
        port: config.port,
        dialect: 'postgres',

        pool: {
            max: 5,
            min: 0,
            idle: 10000
        }
    });


    let
        _authentication, _authenticationSync,
        _create, create, findByMember, _update, _delete;


    /**
     *
     * @param member =: { member: "TEXT", password: "TEXT" }
     * @param callback
     */
    create = function (member, callback) {
        findByMember(member.member, function (err, result) {
           if(err){
               _create(member, callback);
           }else{
               callback("already exist");
           }
        })
    };

    _create = function (member, callback) {
        return _authentication.create(member).then(function (result) {
            callback(null, result);
        }).catch(function (err) {
            callback(null, {status: "error", error: err});
        });
    };

    _update = function (member, callback) {
        _authentication.update({password: member.password}, {where: {member: member.member} }).then(function (result) {
            callback(null, result);
        }).catch(function (err) {
            callback(err);
        })
    };

    _delete = function (member, callback) {
        _authentication.destroy({where: {member: member}}).then(function (result) {
            callback(null, result);
        }).catch(function (err) {
            callback(err);
        });
    };

    /**
     *
     * @param member := TEXT
     * @returns {*}
     */
    findByMember = function (member, callback) {
        return _authentication.findOne( { where: { member: member } } ).then(function (result) {
            result ? callback(null, result.dataValues) : callback("not exist");
        }).catch(function (err) {
            callback(err);
        });
    };

    _authentication = function () {
        _authentication = sequelize.define('authentication', {
            member: Sequelize.TEXT,
            password: Sequelize.TEXT
        });
    };

    _authenticationSync = function () {
        return _authentication.sync();
    };

    return new Promise(function (resolve, reject) {
        sequelize
            .authenticate()
            .then(function() {
                _authentication();
               _authenticationSync().then(function () {

                    resolve({
                        create: create,
                        find : findByMember,
                        update: _update,
                        delete: _delete
                    })
               }).catch(function (err) {
                   reject(err)
               })
            })
            .catch(function (err) {
                reject(err);
            });
    })
};

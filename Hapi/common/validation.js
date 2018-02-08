/**
 * Created by naeltasmim on 09.03.17.
 */

const Joi = require('joi');


module.exports = function () {

    const emailSchema = Joi.string().email();

    const email = function (email, callback) {
        Joi.validate(email, emailSchema, function (err, result) {
            if(!err) {
                callback(null);
            }else{
                callback({status: "error", result: "Email is not valid"});
            }
        });
    };

    return {
        email: email
    }
};
const crypto = require('crypto');
const async = require('async');
const jwt = require('jsonwebtoken');

const config = require('../config');
const { error, mhError } = require('../libs/error');

const secret = config.get('secret');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const accountSchema = new Schema({
    email: { type: String, required: true, unique: true },
    surname: { type: String, required: true },
    firstname: { type: String, required: true },
    patronymic: { type: String },
    role: { type: String, default: 'user' },
    avatar: String,
    activationCode: String,
    passwordResetCode: String,
    passwordResetTime: Number,
    isActivated: { type: Boolean, default: false },
    hashedPassword: { type: String, required: true, select: false },
    salt: { type: String, required: true },
    created: { type: Date, default: Date.now }
});

accountSchema.virtual('password')
    .set(function (password) {
        this._plainPassword = password;
        this.salt = Math.random() + '';
        this.hashedPassword = this.encryptPassword(password);
    })
    .get(function () {
        return this._plainPassword;
    });

accountSchema.methods.encryptPassword = function (password) {
    return crypto.createHmac('sha512', this.salt).update(password).digest('hex');
};

/**
 * Authorize
 * 
 * @function authorize
 * @param {string} email email address
 * @param {string} password password
 * @return {Promise<object>} if resolved returns account object, error if not
 */
accountSchema.statics.authorize = async function (email, password) {
    const Account = this;
    const hash = '';
    try {
        let a = await Account.findOne({ email: email }).select('hashedPassword').exec();
        if (a) {
            hash = a;
            a = await Account.findOne({ email: email });
            if (a.encryptPassword(password) === hash) { return a; }
            else { return error(401, 'WRONG_PASSWORD'); }
        } else { return error(400, 'ACCOUNT_NOT_FOUND'); }
    } catch (e) { return mhError(e); }
};

module.exports = mongoose.model('Account', accountSchema);

const uuid = require('uuid/v4');
const jwt = require('jsonwebtoken');

const config = require('../config');
const secret = config.get('secret');

const Account = require('../models/account');
const mailer = require('../libs/mailer');
const { error, mhError } = require('../libs/error');

exports.signup = async (req, res, next) => {
    let { email, password, surname, firstname, patronymic, avatar } = req.body;
    if (!email || !password || !surname || !firstname) { next(error(400, 'BAD_REQUEST')); }
    else {
        try {
            let a = await Account.findOne({ email: email });
            if (a) { next(error(409, 'ALREADY_EXIST')); }
            else {
                let code = uuid();
                let acc = new Account({
                    email: email,
                    password: password,
                    surname: surname,
                    firstname: firstname,
                    patronymic: (patronymic),
                    avatar: (avatar),
                    activationCode: code
                });
                let r = await acc.save();
                let mailOpts = {
                    email: email,
                    subject: 'Регистрация',
                    text: 'text'
                };
                let rr = await mailer.send(mailOpts.email, mailOpts.subject, mailOpts.text);
                res.status(200).json({ message: 'CREATED' });
            }
        } catch (e) { next(mhError(e)); }
    }
};
exports.login = async (req, res, next) => {
    let { email, password } = req.body;
    if (!email || !password) { next(error(400, 'BAD_REQUEST')); }
    else {
        try {
            let a = await Account.authorize(email, password);
            let payload = {
                id: a._id,
                email: a.email,
                surname: a.surname,
                firstname: a.firstname
            };
            let token = jwt.sign(payload, secret, { expiresIn: '30 days' });
            res.status(200).json({ message: 'OK', refresh: token });
        } catch (e) { next(mhError(e)); }
    }
};
exports.reset = async (req, res, next) => {
    let email = req.body.email;
    if (!email) { next(error(400, 'BAD_REQUEST')); }
    else {
        try {
            let a = await Account.findOne({ email: email });
            let code = uuid();
            a.passwordResetCode = code;
            a.passwordResetTime = Date.now();
            let r = await a.save();
            let mailOpts = {
                email: a.email,
                subject: 'Сброс пароля',
                text: 'text'
            };
            let rr = await mailer.send(mailOpts.email, mailOpts.subject, mailOpts.text);
            res.status(200).json({ message: 'RESET_DONE' });
        } catch (e) { next(mhError(e)); }
    }
};
exports.restore = async (req, res, next) => {
    let code = req.params.id;
    let password = req.body.password;
    if (!code || !password) { next(error(400, 'BAD_REQUEST')); }
    else {
        try {
            let a = await Account.findOne({ passwordResetCode: code });
            a.password = password;
            a.passwordResetTime = Date.now();
            let r = await a.save();
            let mailOpts = {
                email: a.email,
                subject: 'Сброс пароля',
                text: 'text'
            };
            let rr = await mailer.send(mailOpts.email, mailOpts.subject, mailOpts.text);
            res.status(202).json({ message: 'ACCEPTED' });
        } catch (e) { next(mhError(e)); }
    }
};
exports.activate = async (req, res, next) => {
    let code = req.get('activation');
    if (!code) { next(error(400, 'BAD_REQUEST')); }
    else {
        try {
            let a = await Account.findOne({ activationCode: code });
            a.activationCode = 'X';
            a.isActivated = true;
            let r = await a.save();
            let mailOpts = {
                email: a.email,
                subject: 'Активация',
                text: 'text'
            };
            let rr = await mailer.send(mailOpts.email, mailOpts.subject, mailOpts.text);
            res.status(202).json({ message: 'ACCEPTED' });
        } catch (e) { next(mhError(e)); }
    }
};
exports.access = (req, res, next) => {
    let refresh = req.get('x-refresh-token');
    if (!refresh) { next(error(400, 'BAD_REQUEST')); }
    else {
        try {
            let d = jwt.verify(refresh, secret);
            let payload = {
                id: d.id,
                email: d.email,
                surname: d.surname,
                firstname: d.firstname,
                refresh: refresh
            };
            let token = jwt.sign(payload, secret, { expiresIn: '24h' });
            res.status(200).json({ message: 'OK', access: token });
        } catch (e) { next(mhError(e)); }
    }
};
exports.checkAccess = (req, res, next) => {
    let access = req.get('x-access-token');
    if (!access) { next(error(400, 'BAD_REQUEST')); }
    else {
        try {
            let d = jwt.verify(access, secret);
            req.decoded = d;
            next();
        } catch (e) { next(mhError(e)); }
    }
};
exports.isActivated = async (req, res, next) => {
    if (!req.decoded) { next(error(500, 'INTERNAL_SERVER_ERROR')); }
    else {
        try {
            let a = await Account.findOne({ email: req.decoded.email });
            if (a.isActivated) { next(); }
            else { next(error(403, 'FORBIDDEN')); }
        } catch (e) { next(mhError(e)); }
    }
};
exports.me = (req, res) => {
    res.status(200).json({
        message: 'OK',
        account: {
            id: req.decoded.id,
            email: req.decoded.email,
            surname: req.decoded.surname,
            firstname: req.decoded.firstname
        }
    });
};
exports.idd = (req, res) => {
    res.status(200).json({ message: 'OK', id: req.decoded.id });
};

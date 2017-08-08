const nodemailer = require('nodemailer');
const config = require('../config');
const mailer = config.get('mailer');
const transport = nodemailer.createTransport({
    host: mailer.provider,
    port: mailer.port,
    secure: mailer.secure,
    auth: {
        user: mailer.login,
        pass: mailer.password
    }
});

/**
 * Send email
 * 
 * @async
 * @function send
 * @param {string} email email address
 * @param {string} subject letter subject
 * @param {string} text letter body
 * @return {Promise<string>} string if resolved, error if not
 */
exports.send = async (email, subject, text) => {
    const mailOpts = {
        from: mailer.mail,
        to: email,
        subject: subject,
        text: text
    };
    try {
        return await transport.sendMail(mailOpts);
    } catch (e) { return { code: 500, message: e }; }
};

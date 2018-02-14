const db = require('./db');
const parser = require('./parser');

module.exports = s =>
    Object.assign(db(s), {
        parseXml: parser
    });

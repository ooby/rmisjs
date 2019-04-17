const nconf = require('nconf');
const path = require('path');

module.exports = nconf
    .argv()
    .env()
    .file(path.resolve(__dirname, 'config.json'));

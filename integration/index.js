const er14 = require('./er14');
const emk14 = require('./emk14');
module.exports = s => {
    return {
        emk14: emk14(s),
        er14: er14(s)
    };
};

const er14 = require('./er14');
const emk14 = require('./emk14');
const oms = require('./oms');
const nsi = require('./nsi');
module.exports = s => {
    return {
        emk14: emk14(s),
        er14: er14(s),
        oms: oms(s),
        nsi: nsi(s)
    };
};

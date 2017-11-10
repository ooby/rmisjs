const moment = require('moment');

const days = 5;
const format = 'YYYY-MM-DD';

let dates = [moment().format(format)];
for (let i = 1; i < days; i++) {
    dates.push(moment().add(i, 'day').format(format));
}

module.exports = dates;

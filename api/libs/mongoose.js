const mongoose = require('mongoose');
const dbConnect = config => mongoose.connect(config.uri, config.options, e => {
    if (e) { console.log(e); }
    else { console.log('DB connected to', config.get('mongoose:uri')); }
});
module.exports = dbConnect;

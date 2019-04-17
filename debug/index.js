const args = process.argv.slice(2);
const command = args.shift();
const config = require('../config').get();
const time = () => {
    const [seconds, nanos] = process.hrtime();
    return Math.trunc(seconds * 1000 + nanos / 1000000);
};
const start = time();
require(`./script/${command}`)(config, ...args)
    .then(data => {
        let delta = time() - start;
        console.log(data);
        console.log(`Resolved in ${delta} ms.`);
    })
    .catch(e => {
        let delta = time() - start;
        console.error(e);
        console.log(`Rejected in ${delta} ms.`);
    });

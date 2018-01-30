const createClient = require('../client');

module.exports = async s => {
    let c = await createClient(s);
    return {
        describe: () => c.describe(),
        PoiskERZ_FIO: d => new Promise((resolve, reject) => {
            c.PoiskERZ_FIO(d, (e, r) => {
                if (e) reject(e);
                resolve(r);
            });
        })
    };
};

const async = require('async');
const getLoc = async (s, id) => {
    const rmisjs = require('../index')(s);
    const rmis = rmisjs.rmis;
    try {
        let r = await rmis.resource();
        r = await r.getLocation({ location: id });
        r = (r) ? r.location : null;
        return r;
    } catch (e) { return e; };
};
const getLocs = async s => {
    const rmisjs = require('../index')(s);
    const rmis = rmisjs.rmis;
    try {
        let r = await rmis.resource();
        r = await r.getLocations({ clinic: s.rmis.clinicId });
        return r;
    } catch (e) { return e; }
};
exports.getLocationsWithPortal = s => {
    return new Promise(async (resolve, reject) => {
        try {
            let r = await getLocs(s);
            let result = [];
            await r.location.reduce((p, c) => p.then(async () => {
                let k = await getLoc(s, c);
                result.push(k);
                return c;
            }), Promise.resolve());
            r = result.filter(i => !!i)
                .filter(i => i.source && i.source.indexOf('PORTAL') !== -1);
            resolve(r);
        } catch (e) { reject(e); }
    });
};
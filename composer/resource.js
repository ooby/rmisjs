const getLoc = async (s, id) => {
    const rmisjs = require('../index')(s);
    const rmis = rmisjs.rmis;
    try {
        let r = await rmis.resource();
        r = await r.getLocation({ location: id });
        r = (r) ? r.location : null;
        return r;
    } catch (e) { return; };
};
const getLocs = async s => {
    const rmisjs = require('../index')(s);
    const rmis = rmisjs.rmis;
    try {
        let r = await rmis.resource();
        r = await r.getLocations({ clinic: s.rmis.clinicId });
        return r;
    } catch (e) { return; }
};
exports.getLocationsWithPortal = s => {
    return new Promise(async (resolve, reject) => {
        try {
            let r = await getLocs(s);
            r = await Promise.all(r.location.map(i => getLoc(s, i)));
            r = r.filter(i => !!i)
                .filter(i => i.source && i.source.indexOf('PORTAL') !== -1);
            resolve(r);
        } catch (e) { reject(e); }
    });
};
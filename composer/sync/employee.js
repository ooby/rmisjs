const { empFormat } = require('./format');
exports.syncEmployees = async s => {
    try {
        const rmisjs = require('../../index')(s);
        const composer = rmisjs.composer;
        const er14 = await rmisjs.integration.er14.process();
        let r = await composer.getDetailedLocations();
        let result = [];
        await r.reduce((p, i) => p.then(async () => {
            try {
                let d = {
                    docCode: i.snils,
                    snils: i.snils,
                    firstName: i.name,
                    middleName: i.patrName,
                    lastName: i.surname,
                    specCode: (Array.isArray(i.speciality)) ? i.speciality[0] : i.speciality,
                    positionCode: (Array.isArray(i.position)) ? i.position[0] : i.position,
                    muCode: s.er14.muCode
                };
                let u = empFormat(d);
                let rr = await er14.updateStaffInfo(u);
                result.push(rr);
            } catch (e) { console.error(e); }
            return i;
        }), Promise.resolve());
        return result;
    } catch (e) { return e; }
};

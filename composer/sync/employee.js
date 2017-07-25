const empFormat = d => {
    return {
        'ct:docCode': d.docCode,
        'ct:snils': d.snils,
        'ct:firstName': d.firstName,
        'ct:middleName': d.middleName,
        'ct:lastName': d.lastName,
        'ct:specCode': d.specCode,
        'ct:positionCode': d.positionCode,
        'pt:muCode': d.muCode
    }
};
exports.syncEmployees = s => {
    const rmisjs = require('../../index')(s);
    const composer = rmisjs.composer;
    const er14 = rmisjs.integration.er14;
    return new Promise(async (resolve, reject) => {
        try {
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
            resolve(result);
        } catch (e) { reject(e); }
    });
};
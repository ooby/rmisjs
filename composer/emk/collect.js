const rmisjs = require('../../index');
const document = require('../libs/document');

module.exports = async s => {
    const cache = new Map();
    const [ind, doc] = await Promise.all([
        rmisjs(s).rmis.individual(),
        document(s)
    ]);

    const parseIndividual = async(uid, defaultSnils) => {
        if (cache.has(uid)) return cache.get(uid);
        let [indiv, snils] = await Promise.all([
            ind.getIndividual(uid),
            defaultSnils || doc.getSnils(uid)
        ]);
        let data = {
            mcod: s.er14.muCode,
            snils,
            LastName: indiv.surname,
            FirstName: indiv.name,
            MiddleName: indiv.patrName,
            BirthDate: indiv.birthDate,
            Sex: indiv.gender
        };
        cache.set(uid, data);
        return data;
    };

    return {
        clearCache: () => cache.clear(),
        getPatient: data => parseIndividual(data[0]),
        getDoctors: async data => {
            let uids = [];
            let doctors = [];
            await Promise.all(
                data.slice(1).map(async i => {
                    let services = i[Object.keys(i).pop()].Services;
                    if (!services) return;
                    services = [].concat(services.Service);
                    await Promise.all(
                        services.map(async j => {
                            let { doctor } = j;
                            let { uid, snils } = doctor;
                            if (uids.indexOf(uid) > -1) return;
                            uids.push(uid);
                            let parsed = await parseIndividual(uid, snils);
                            if (!parsed) return;
                            doctors.push(parsed);
                        })
                    );
                })
            );
            return doctors;
        }
    };
};

const rmisjs = require('../../index');
const document = require('../libs/document');

module.exports = async s => {
    const cache = new Map();
    const [ind, doc] = await Promise.all([
        rmisjs(s).rmis.individual(),
        document(s)
    ]);

    const parseIndividual = async(uid, snils) => {
        if (cache.has(uid)) return cache.get(uid);
        let indiv = await ind.getIndividual(uid);
        if (!snils) {
            snils = await doc.searchSnils(uid);
            if (!snils) return null;
            if (!snils.number) return null;
            snils = snils.number;
        }
        let data = {
            mcod: s.er14.muCode,
            snils: snils,
            LastName: indiv.surname,
            FirstName: indiv.name,
            MiddleName: indiv.patrName,
            BirthDate: indiv.birthDate ? indiv.birthDate.replace(/\+.*$/g, '') : null,
            Sex: {
                '@version': '1.0',
                '$': indiv.gender
            }
        };
        cache.set(uid, data);
        return data;
    };

    return {
        clearCache: () => cache.clear(),
        getPatient: uid => parseIndividual(uid),
        getDoctors: async forms => {
            let uids = [];
            let doctors = [];
            await Promise.all(
                forms.map(async i => {
                    if (!i) return null;
                    if (Object.values(i).indexOf(null) > -1) return null;
                    let services = i.form.Services;
                    if (!services) return;
                    services = [].concat(services.Service);
                    await Promise.all(
                        services.map(async j => {
                            if (!j) return;
                            let doctor = j.doctor;
                            let uid = doctor.uid;
                            let snils = doctor.snils;
                            if (uids.indexOf(uid) > -1) return;
                            uids.push(uid);
                            let parsed = await parseIndividual(uid, snils);
                            parsed.postCode = doctor.postCode;
                            parsed.specialityCode = doctor.specialityCode;
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

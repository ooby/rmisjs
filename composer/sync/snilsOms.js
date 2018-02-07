const timeout = m => new Promise(r => setTimeout(r, m));
const { isSnils } = require('../libs/collect');
exports.syncSnils = async (s, p) => {
    const rmisjs = require('../../index')(s);
    const rmis = rmisjs.rmis;
    const oms = rmisjs.integration.oms;
    try {
        let rPat = await rmis.patient();
        let r = await rPat.searchPatient({ page: p, regClinicId: s.rmis.clinicId });
        let rmisIndiv = await rmis.individual();
        let result = [];
        for (let i of r.patient) {
            if (i.toString().length > 1) {
                let doc = await rmisIndiv.getIndividualDocuments(i);
                let count = 0;
                let docs = [];
                if (doc && doc.document) {
                    for (let j of doc.document) {
                        if (j.toString().length > 1) {
                            let docum = await rmisIndiv.getDocument(j);
                            if (docum && docum.type === '19') { count++; }
                            docs.push(docum);
                        }
                    }
                }
                if (count === 0) {
                    result.push({ uid: i, document: docs });
                }
            }
        }
        let omsIndiv = await oms.poiskErz(s);
        let vrb = 0;
        for (let i of result) {
            let ind = await rmisIndiv.getIndividual(i.uid);
            vrb++;
            if (ind && ind.birthDate) {
                await timeout(5000);
                let omsInd = await omsIndiv.PoiskERZ_FIO({
                    FAM: ind.surname,
                    IM: ind.name,
                    OT: ind.patrName,
                    DR: ind.birthDate.slice(0, -6)
                });
                Object.assign(i, { oms: omsInd });
                let snils = '';
                if (omsInd && omsInd.Results && omsInd.Results.Insurant && omsInd.Results.Insurant.PFR) {
                    snils = omsInd.Results.Insurant.PFR;
                }
                if (isSnils(snils)) {
                    await rmisIndiv.createDocument({
                        individualUid: i.uid,
                        type: '19',
                        number: snils,
                        active: true
                    });
                    console.log(Number((p - 1) * 25 + vrb), i.uid, 'OK');
                } else {
                    console.log(Number((p - 1) * 25 + vrb), i.uid, ind.surname, ind.name, ind.patrName, snils, isSnils(snils));
                }
            }
        }
    } catch (e) {
        console.error(e);
        return e;
    }
};

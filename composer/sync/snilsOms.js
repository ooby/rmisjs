const { isSnils } = require('../libs/collect');
const document = require('../libs/document');

module.exports = async s => {
    const { rmis, integration } = require('../../index')(s);
    const { oms } = integration;
    const [rPat, rmisIndiv, omsIndiv, docs] = await Promise.all([
        rmis.patient(),
        rmis.individual(),
        oms.poiskErz(s),
        document(s)
    ]);

    const syncPatient = async i => {
        if (!i) return ['', 'uid'];
        let snils = await docs.searchSnils(i);
        if (snils) return [snils.number, 'exists'];
        snils = '';
        let ind = await rmisIndiv.getIndividual(i);
        if (!ind) return ['', 'ind'];
        if (!ind.surname || !ind.name || !ind.patrName || !ind.birthDate)
            return ['', 'ind'];
        let omsInd = await omsIndiv.PoiskERZ_FIO({
            FAM: ind.surname,
            IM: ind.name,
            OT: ind.patrName,
            DR: ind.birthDate.replace(/\+.*/, '').trim()
        });
        if (
            omsInd &&
            omsInd.Results &&
            omsInd.Results.Insurant &&
            omsInd.Results.Insurant.PFR
        ) {
            snils = omsInd.Results.Insurant.PFR || '';
        }
        let valid = isSnils(snils);
        if (!valid) return [snils, 'no oms'];
        await rmisIndiv.createDocument({
            individualUid: i,
            type: 19,
            number: snils,
            active: true
        });
        return [snils, 'updated'];
    };

    const syncPage = async (p, limit = 25) => {
        let r = await rPat.searchPatient({
            page: p,
            regClinicId: s.rmis.clinicId
        });
        if (!r) return null;
        if (!r.patient) return null;
        let data = [].concat(r.patient);
        let vrb = 0;
        while (data.length) {
            await Promise.all(
                data.splice(0, limit).map(async i => {
                    if (!i) return;
                    let log;
                    try {
                        log = await syncPatient(i);
                    } catch (e) {
                        console.error(e.message || e);
                    } finally {
                        console.log(
                            Number((p - 1) * 25 + vrb++),
                            i,
                            ...[].concat(log)
                        );
                    }
                })
            );
        }
    };

    const syncPages = async (from, to, pageLimit = 1, patientLimit = null) => {
        for (let i = from; i <= to; i += pageLimit) {
            let pages = [];
            for (let j = i; j < i + pageLimit; j++) {
                pages.push(syncPage(j, patientLimit).catch(console.error));
            }
            let results = await Promise.all(pages);
            if (results.indexOf(null) > -1) return null;
        }
    };

    const composeMethod = async fn => {
        try {
            return await fn();
        } catch (e) {
            console.error(e);
        } finally {
            docs.clearCache();
        }
    };

    return {
        syncPage: (page, patientLimit) =>
            composeMethod(() => syncPage(page, patientLimit)),
        syncPages: (from, to, pageLimit, patientLimit) =>
            composeMethod(() => syncPages(from, to, pageLimit, patientLimit)),
        syncPatient: uid => composeMethod(() => syncPatient(uid))
    };
};

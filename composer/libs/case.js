const soap = require('soap');
const refbooks = require('refbooks');
const moment = require('moment');
const url = require('url');
const ss = require('string-similarity');
const rmisjs = require('../../index');

const wsdl = '/carbondss/services/MedbaseCases/MedbaseCases.SecureSOAP11Endpoint.xml';
const endpoint = '/carbondss/services/MedbaseCases.SOAP11Endpoint/';

/**
 * Возвращает значение поля из справочника по значению поля имени.
 * @param {Object} dict - справочник
 * @param {String} name - значение поля имени
 * @return {Promise<String>} - значение заданного поля
 */
const getCodeByName = (dict, name) => {
    let names = dict.map(i => i.name.toUpperCase());
    let index = ss.findBestMatch(name.toUpperCase(), names);
    index = names.indexOf(index.bestMatch.target);
    return dict[index].code;
};

const match = (pattern, arr) => {
    for (let item of [].concat(arr)) {
        if (!pattern.test(item)) continue;
        return item;
    }
    return null;
};

const deseaseTypeMatch = (id, injury) => {
    if (parseInt(injury) !== 0) return 9;
    switch (parseInt(id)) {
        case 1: return 5;
        case 2: return 6;
        case 3: return 7;
        case 4: return 3;
        case 5: return 2;
        case 6: return 99;
        case 7: return 2;
        case 8: return 0;
        case 9: return 99;
        default: return 99;
    }
};

const unformattedSnilsPattern = /^\d{11}$/;
const formattedSnilsPattern = /^\d{3}-\d{3}-\d{3}\s\d{2}$/;
const parseSnils = document => {
    if (!document) return null;
    if (!document.type || !document.number) return null;
    if (parseInt(document.type) !== 19) throw new Error('Not a SNILS');
    let snils = document.number.trim();
    if (formattedSnilsPattern.test(snils)) return snils;
    if (!unformattedSnilsPattern.test(snils)) throw new Error('Wrong SNILS');
    return (
        snils.slice(0, 3) + '-' +
        snils.slice(3, 6) + '-' +
        snils.slice(6, 9) + ' ' +
        snils.slice(9, 11)
    );
};

module.exports = async s => {
    let dict = new Map();
    let doctors = new Map();
    let documents = new Map();

    const populateCache = async () => {
        await getMappedRefbook('MDP365', '1.0', [1, 3]);
        await getMappedRefbook('PRK470', '1.0', [0, 1]);
        await getMappedRefbook('HST0020', '1.0', [0, 1]);
        await getMappedRefbook('C33001', '1.0', [0, 3]);
    };

    const clearCache = () => {
        dict.clear();
        doctors.clear();
        documents.clear();
    };

    const c = await soap.createClientAsync(url.resolve(s.rmis.path, wsdl), {
        endpoint: url.resolve(s.rmis.path, endpoint)
    });
    c.setSecurity(new soap.BasicAuthSecurity(s.rmis.auth.username, s.rmis.auth.password));

    const rb = refbooks(s);
    const rmis = await rmisjs(s).rmis;
    const [individual, employee, refbook] = await Promise.all([
        rmis.individual(),
        rmis.employee(),
        rmis.refbook()
    ]);

    const getMappedRefbook = async(code, version, indexes) => {
        if (dict.has(code)) return dict.get(code);
        let parts = await rb.getRefbookParts({
            code,
            version
        });
        let result = [];
        for (let i = 1; i <= parts; i++) {
            let r = await rb.getRefbook({
                code,
                version,
                part: i
            });
            result = result.concat(
                r.data.map(i => {
                    return {
                        code: i[indexes[0]].value,
                        name: i[indexes[1]].value
                    };
                })
            );
        }
        dict.set(code, result);
        return result;
    };

    /**
     * Возвращает значение соответствующего поля из справочника.
     * @param {Object} d - параметры
     * @param {String} d.code - oid справочника
     * @param {String} d.version - версия справочника
     * @param {String} d.col - поле запроса
     * @param {String} d.val - значение поля запроса
     * @param {String} d.res - возвращаемое поле
     * @param {Object} def - значение по-умолчанию
     * @return {Promise<String>}
     */
    const getRefbookValue = async (d, def = null) => {
        let data = await refbook.getRefbookRowData({
            refbookCode: d.code,
            version: d.version,
            column: {
                name: d.col,
                data: d.val
            }
        });
        if (!data) return def;
        data = data.row[0].column.reduce((p, i) => {
            p[i.name] = i.data;
            return p;
        }, {});
        return data[d.res] || def;
    };

    const searchDocument = async (uid, type) => {
        uid = [].concat(uid).pop();
        if (documents.has(uid)) return documents.get(uid);
        if (!uid) return null;
        let docs = await individual.getIndividualDocuments(uid);
        if (!docs) return null;
        docs = docs.document;
        if (!docs) return null;
        if (docs.length === 0) return null;
        for (let doc of [].concat(docs)) {
            doc = await individual.getDocument(doc);
            if (!doc) continue;
            if (doc.type !== type) continue;
            documents.set(uid, doc);
            return doc;
        }
        return null;
    };

    const getCaseByIndividual = async d => {
        let data = await c.searchCaseAsync({
            patientUid: d
        });
        if (!data) return null;
        if (!data.cases) return null;
        return data.cases.caseComplex;
    };

    const parseDoctor = async (thecase, visit) => {
        let docUid = visit.Doctor.Patient.patientUid;
        if (doctors.has(docUid)) return doctors.get(docUid);
        let doctor = {
            snils: parseSnils(await searchDocument(visit.Doctor.Patient.patientUid, '19')),
            postCode: await getCodeByName(dict.get('MDP365'), visit.Doctor.positionName),
            specialtyCode: await getCodeByName(
                dict.get('C33001'),
                await getRefbookValue({
                    code: '1.2.643.5.1.13.3.2861820518965.1.1.118',
                    version: 'CURRENT',
                    col: 'ID',
                    val: visit.Doctor.positionId,
                    res: 'CODE'
                })
            )
        };
        if (!doctor.snils || !doctor.postCode || !doctor.specialtyCode) return null;
        doctors.set(docUid, doctor);
        return doctor;
    };

    const parseDiagnosis = (thecase, visit) => {
        let mainDiagnosisCode = null;
        let characterDiagnosisCode = null;
        let concomitantDiagnosis = [];
        for (let i of [].concat(visit.diagnoses.diagnos)) {
            if (i.Main !== 'true') {
                concomitantDiagnosis.push(i.diagnosMKB);
            } else {
                mainDiagnosisCode = i.diagnosMKB;
                characterDiagnosisCode = deseaseTypeMatch(i.deseaseTypeId, i.injuryTypeId);
            }
        }
        return !mainDiagnosisCode || !characterDiagnosisCode ? null : {
            mainDiagnosisCode,
            characterDiagnosisCode,
            concomitantDiagnosis
        };
    };

    const parseVisitDate = visit => {
        let dateTime = visit.admissionDate.replace(/\+.*$/, '') + 'T';
        dateTime += visit.admissionTime || ('00:00:00.000' + moment().format('Z'));
        return dateTime;
    };

    const parsePaymentData = thecase => {
        let paymentData = {
            typePaymentCode: thecase.fundingSourceTypeId,
            policyNumber: match(/^\d{16}$/, thecase.Patient.polis),
            insuranceCompanyCode: thecase.docIssuer
        };
        if (thecase.fundingSourceTypeId === '2') return null;
        if (thecase.fundingSourceTypeId === '5') paymentData.typePaymentCode = '2';
        if (!paymentData.policyNumber) delete paymentData.policyNumber;
        return paymentData;
    };

    const parseVisit = async (thecase, visit) => {
        if (!visit.diagnoses) return null;
        let doctor = await parseDoctor(thecase, visit);
        if (!doctor) return null;
        let diagnosis = parseDiagnosis(thecase, visit);
        let resultCode = await getRefbookValue({
            code: '1.2.643.5.1.13.3.2861820518965.1.1.212',
            version: 'CURRENT',
            col: 'ID',
            val: visit.visitResultId,
            res: 'CODE'
        });
        if (!resultCode) return null;
        let outcomeCode = await getRefbookValue({
            code: '1.2.643.5.1.13.3.2861820518965.1.1.54',
            version: 'CURRENT',
            col: 'ID',
            val: visit.deseaseResultId,
            res: 'CODE'
        });
        if (!outcomeCode) return null;
        let visitData = {
            dateTime: parseVisitDate(visit),
            placeServicesCode: visit.placeId,
            purposeVisitCode: visit.goalId,
            typeTreatmentCode: !visit.repeated ? '2' : '1',
            typeAssistanceCode: thecase.careLevelCode,
            formCode: thecase.careProvidingFormCode
        };
        let paymentData = parsePaymentData(thecase);
        if (!paymentData) return null;
        let renderedServices = visit.renderedServices ? [].concat(visit.renderedServices.renderedService) : [];
        let Services = [];
        for (let i of renderedServices) {
            Services.push({
                serviceCode: await getCodeByName(dict.get('HST0020'), i.serviceName),
                unitCode: 1, // TODO
                quantityServices: renderedServices.length,
                doctor
            });
        }
        return Object.assign({
            visit: visitData,
            paymentData,
            resultCode,
            outcomeCode,
            Services
        }, diagnosis);
    };

    const get025ByIndividual = async d => {
        await populateCache();
        let result = [];
        for (let thecase of await getCaseByIndividual(d)) {
            if (!thecase) continue;
            if (!!thecase.hspRecords || thecase.stateId !== '1') continue;
            let doc = await searchDocument(thecase.Patient.patientUid, '26');
            if (!doc) continue;
            if (!doc.issuer || !doc.number) continue;
            thecase.Patient.polis = doc.number;
            thecase.docIssuer = await getRefbookValue({
                code: '1.2.643.5.1.13.3.2861820518965.1.1.111',
                version: 'CURRENT',
                col: 'ID',
                val: doc.issuer,
                res: 'CODE'
            });
            if (!thecase.docIssuer) continue;
            thecase.careLevelCode = await getRefbookValue({
                code: '1.2.643.5.1.13.3.2861820518965.1.1.242',
                version: 'CURRENT',
                col: 'ID',
                val: thecase.careLevelId,
                res: 'CODE'
            });
            thecase.careProvidingFormCode = await getCodeByName(
                dict.get('PRK470'),
                await getRefbookValue({
                    code: '1.2.643.5.1.13.3.2861820518965.1.1.27',
                    version: 'CURRENT',
                    col: 'ID',
                    val: thecase.careProvidingFormId,
                    res: 'NAME'
                }, '1')
            );
            let visits = !!thecase.Visits ? [].concat(thecase.Visits.Visit) : [];
            for (let visit of visits) {
                let data = await parseVisit(thecase, visit);
                if (!data) continue;
                result.push(data);
            }
        }
        clearCache();
        return result;
    };

    return {
        /**
         * Форма 025-12/у по UID пациента
         * @param {String} d - UID пациента
         * @return {Promise<Object>}
         */
        async get025ByIndividual(d) {
            try {
                let data = await get025ByIndividual(d);
                return data;
            } catch (e) {
                console.error(e);
                return e;
            }
        },

        async getCaseByIndividual(d) {
            try {
                let data = await getCaseByIndividual(d);
                return data;
            } catch (e) {
                console.error(e);
                return e;
            }
        }
    };
};

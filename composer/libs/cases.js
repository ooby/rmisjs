const soap = require('soap');
const refbooks = require('refbooks');
const moment = require('moment');
const url = require('url');
const ss = require('string-similarity');
const rmisjs = require('../../index');
const Queue = require('./queue');

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
        case 1:
            return 5;
        case 2:
            return 6;
        case 3:
            return 7;
        case 4:
            return 3;
        case 5:
            return 2;
        case 6:
            return 99;
        case 7:
            return 2;
        case 8:
            return 0;
        case 9:
            return 99;
        default:
            return 99;
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

const waitForNull = async obj => {
    let promises = Object.entries(obj).map(async([key, value]) => {
        value = await value;
        obj[key] = value;
        return value;
    });
    let check = await Promise.race(promises);
    if (!check) return null;
    await Promise.all(promises);
    return obj;
};

const rbq = new Queue(1);
const refq = new Queue(1);
const indq = new Queue(1);
const casq = new Queue(1);

const composeLib = async s => {
    const dict = new Map();
    const doctors = new Map();
    const documents = new Map();

    const populateCache = () => {
        dict.set('MDP365', mapRefbook('MDP365', '1.0', [1, 3]));
        dict.set('PRK470', mapRefbook('PRK470', '1.0', [0, 1]));
        dict.set('HST0020', mapRefbook('HST0020', '1.0', [0, 1]));
        dict.set('C33001', mapRefbook('C33001', '1.0', [0, 3]));
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
    const [individual, refbook] = await Promise.all([
        rmis.individual(),
        rmis.refbook()
    ]);

    /**
     * Возвращает поля из справочника НСИ по индексам полей
     * @param {String} code
     * @param {String} version
     * @param {Array<Number>} indexes
     * @return {Promise<object>}
     */
    const mapRefbook = async(code, version, indexes) => {
        let parts = await rbq.push(() =>
            rb.getRefbookParts({
                code,
                version
            })
        );
        let result = [];
        await Promise.all(
            new Array(parts).fill(0).map(async(_, i) => {
                let r = await rbq.push(() =>
                    rb.getRefbook({
                        code,
                        version,
                        part: ++i
                    })
                );
                result = result.concat(
                    r.data.map(j => {
                        return {
                            code: j[indexes[0]].value,
                            name: j[indexes[1]].value
                        };
                    })
                );
            })
        );
        return result;
    };

    /**
     * Возвращает значение соответствующего поля из справочника.
     * Если поле или его значение не существует, то возвращает значение по-умолчанию.
     * @param {Object} d - параметры
     * @param {String} d.code - OID справочника
     * @param {String} d.version - версия справочника
     * @param {String} d.col - поле запроса
     * @param {String} d.val - значение поля запроса
     * @param {String} d.res - возвращаемое поле
     * @param {Object} [def] - возвращаемое значение по-умолчанию
     * @return {Promise<String>}
     */
    const getRefbookValue = async(d, def = null) => {
        let data = await refq.push(() =>
            refbook.getRefbookRowData({
                refbookCode: d.code,
                version: d.version,
                column: {
                    name: d.col,
                    data: d.val
                }
            })
        );
        if (!data) return def;
        data = data.row[0].column.reduce((p, i) => {
            p[i.name] = i.data;
            return p;
        }, {});
        return data[d.res] || def;
    };

    /**
     * Поиск документа по UID физического лица и типу документа
     * @param {String} uid
     * @param {String} type
     * @return {Promise<Object>}
     */
    const searchDocument = async(uid, type) => {
        uid = [].concat(uid).pop();
        if (documents.has(uid)) return documents.get(uid);
        if (!uid) return null;
        let docs = await indq.push(() => individual.getIndividualDocuments(uid));
        if (!docs) return null;
        docs = docs.document;
        if (!docs) return null;
        if (docs.length === 0) return null;
        return await new Promise((resolve, reject) => {
            let resolved = false;
            let res = data => {
                if (resolved) return;
                resolved = true;
                resolve(data);
            };
            Promise.all(
                [].concat(docs).map(i =>
                    individual.getDocument(i)
                    .then(doc => {
                        if (!doc) return;
                        if (doc.type !== type) return;
                        documents.set(uid, doc);
                        res(doc);
                    })
                )
            ).then(() => res(null));
        });
    };

    /**
     * Возвращает все случаи по UID физического лица
     * @param {String} patientUid
     * @return {Promise<Object>}
     */
    const getCaseByIndividual = async patientUid => {
        let data = await casq.push(() =>
            c.searchCaseAsync({
                patientUid
            })
        );
        if (!data) return null;
        if (!data.cases) return null;
        return data.cases.caseComplex;
    };

    /**
     * Возвращает СНИЛС по UID физического лица
     * @param {String} uid
     * @return {Promise<String>}
     */
    const parseDoctorDocument = async uid => {
        let doc = await searchDocument(uid, '19');
        return !doc ? null : parseSnils(doc);
    };

    /**
     * Возвращает код должности врача по названию должности
     * @param {String} positionName
     * @return {Promise<String>}
     */
    const parseDoctorPost = async positionName => {
        let mdp365 = await dict.get('MDP365');
        let code = getCodeByName(mdp365, positionName);
        return !code ? null : code;
    };

    /**
     * Возвращает код специальности врача по ID должности
     * @param {String | Number} positionId
     * @return {Promise<Object>}
     */
    const parseDoctorSpec = async positionId => {
        let [c33001, code] = await Promise.all([
            dict.get('C33001'),
            getRefbookValue({
                code: '1.2.643.5.1.13.3.2861820518965.1.1.118',
                version: 'CURRENT',
                col: 'ID',
                val: positionId,
                res: 'CODE'
            })
        ]);
        return await getCodeByName(c33001, code);
    };

    /**
     * Возвращает сведения о враче
     * @param {Object} thecase - случай пациента
     * @param {Object} visit - посещение пацинта
     * @return {Promise<Object>}
     */
    const parseDoctor = async(thecase, visit) => {
        if (!thecase || !visit) return null;
        let docUid = visit.Doctor.Patient.patientUid;
        if (doctors.has(docUid)) return doctors.get(docUid);
        let doctor = await waitForNull({
            snils: parseDoctorDocument(visit.Doctor.Patient.patientUid),
            postCode: parseDoctorPost(visit.Doctor.positionName),
            specialtyCode: parseDoctorSpec(visit.Doctor.positionId)
        });
        if (!doctor) return null;
        doctors.set(docUid, doctor);
        return doctor;
    };

    /**
     * Возвращает объект с полями диагнозов
     * @param {Object} thecase - случай
     * @param {Object} visit - посещение
     * @return {Promise<Object>} - поля диагнозов
     */
    const parseDiagnosis = async(thecase, visit) => {
        if (!thecase || !visit) return null;
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

    /**
     * Возвращает дату посещения
     * @param {Object} visit - посещение
     * @return {String}
     */
    const parseAdmissionDate = visit => {
        if (!visit) return null;
        let dateTime = visit.admissionDate.replace(/\+.*$/, '') + 'T';
        dateTime += visit.admissionTime || ('00:00:00.000' + moment().format('Z'));
        return dateTime;
    };

    const parsePaymentData = thecase => {
        if (!thecase) return null;
        let paymentData = {
            typePaymentCode: thecase.fundingSourceTypeId,
            policyNumber: match(/^\d{16}$/, thecase.Patient.polis),
            insuranceCompanyCode: thecase.document.issuerCode
        };
        if (thecase.fundingSourceTypeId === '2') return null;
        if (thecase.fundingSourceTypeId === '5') paymentData.typePaymentCode = '2';
        if (!paymentData.policyNumber) delete paymentData.policyNumber;
        return paymentData;
    };

    const parseVisit = (thecase, visit) => {
        if (!thecase || !visit) return null;
        let dateTime = parseAdmissionDate(visit);
        return !dateTime ? null : {
            dateTime,
            placeServicesCode: visit.placeId,
            purposeVisitCode: visit.goalId,
            typeTreatmentCode: !visit.repeated ? '2' : '1',
            typeAssistanceCode: thecase.careLevelCode,
            formCode: thecase.careProvidingFormCode
        };
    };

    const parseService = async(thecase, visit) => {
        if (!thecase || !visit) return null;
        let data = await waitForNull({
            doctor: parseDoctor(thecase, visit),
            hst0020: dict.get('HST0020')
        });
        if (!data) return null;
        let renderedServices = visit.renderedServices ? [].concat(visit.renderedServices.renderedService) : [];
        return await Promise.all(
            renderedServices.map(async i => {
                return {
                    serviceCode: await getCodeByName(data.hst0020, i.serviceName),
                    unitCode: 1, // TODO
                    quantityServices: renderedServices.length,
                    doctor: data.doctor
                };
            })
        );
    };

    const parseVisitResult = resultId =>
        getRefbookValue({
            code: '1.2.643.5.1.13.3.2861820518965.1.1.212',
            version: 'CURRENT',
            col: 'ID',
            val: resultId,
            res: 'CODE'
        });

    const parseDiseaseResult = deseaseResultId =>
        getRefbookValue({
            code: '1.2.643.5.1.13.3.2861820518965.1.1.54',
            version: 'CURRENT',
            col: 'ID',
            val: deseaseResultId,
            res: 'CODE'
        });

    const parse025Visit = async(thecase, visit) => {
        if (!thecase || !visit) return null;
        if (!visit.diagnoses) return null;
        let data = await waitForNull({
            diagnosis: parseDiagnosis(thecase, visit),
            resultCode: parseVisitResult(visit.visitResultId),
            outcomeCode: parseDiseaseResult(visit.deseaseResultId),
            visit: parseVisit(thecase, visit),
            paymentData: parsePaymentData(thecase),
            Services: parseService(thecase, visit)
        });
        if (!data) return null;
        let diagnosis = data.diagnosis;
        delete data.diagnosis;
        return Object.assign(data, diagnosis);
    };

    const parsePatientDocument = async uid => {
        if (!uid) return null;
        let doc = await searchDocument(uid, '26');
        if (!doc) return null;
        doc.issuerCode = await getRefbookValue({
            code: '1.2.643.5.1.13.3.2861820518965.1.1.111',
            version: 'CURRENT',
            col: 'ID',
            val: doc.issuer,
            res: 'CODE'
        });
        return doc;
    };

    const parseForm = async careProvidingFormId => {
        let [prk470, name] = await Promise.all([
            dict.get('PRK470'),
            getRefbookValue({
                code: '1.2.643.5.1.13.3.2861820518965.1.1.27',
                version: 'CURRENT',
                col: 'ID',
                val: careProvidingFormId,
                res: 'NAME'
            }, '1')
        ]);
        return await getCodeByName(prk470, name);
    };

    const parseCare = careLevelId =>
        getRefbookValue({
            code: '1.2.643.5.1.13.3.2861820518965.1.1.242',
            version: 'CURRENT',
            col: 'ID',
            val: careLevelId,
            res: 'CODE'
        });

    const parseCase = async (d, casecb, visitcb) => {
        populateCache();
        let cases = await getCaseByIndividual(d);
        let result = [];
        await Promise.all(
            cases.map(async thecase => {
                thecase = await casecb(thecase);
                if (!thecase) return;
                let visits = !!thecase.Visits ? [].concat(thecase.Visits.Visit) : [];
                await Promise.all(
                    visits.map(async i => {
                        let data = await visitcb(thecase, i);
                        if (!!data) result = result.concat(data);
                    })
                );
            })
        );
        clearCache();
        return result;
    };

    const get025ByIndividual = async d => {
        populateCache();
        let cases = await getCaseByIndividual(d);
        let result = [];
        await Promise.all(
            cases.map(async thecase => {
                if (!thecase) return null;
                if (!!thecase.hspRecords ||
                    thecase.stateId === '1' ||
                    thecase.stateId === '2' ||
                    thecase.stateId === '7') return null;
                let data = await waitForNull({
                    document: parsePatientDocument(thecase.Patient.patientUid),
                    careLevelCode: parseCare(thecase.careLevelId),
                    careProvidingFormCode: parseForm(thecase.careProvidingFormId)
                });
                if (!data) return null;
                Object.assign(thecase.Patient, {
                    polis: data.document.number
                });
                Object.assign(thecase, data);
                if (!thecase) return;
                let visits = !!thecase.Visits ? [].concat(thecase.Visits.Visit) : [];
                await Promise.all(
                    visits.map(async i => {
                        let data = await parse025Visit(thecase, i);
                        if (!!data) result = result.concat(data);
                    })
                );
            })
        );
        clearCache();
        return result;
    };

    const parseAdmission = async (thecase, record) =>
        waitForNull({
            dateTimeReceipt: Promise.resolve(parseAdmissionDate(record)),
            indicationsHospitalizationCode: Promise.resolve(thecase.careProvidingFormCode),
            // channelHospitalizationCode:
        });

    const parseHspRecord = async (thecase, record) => {
        // let form = {
        //     PrimaryInformationAdmission: {
        //         dateTimeReceipt: null,
        //         indicationsHospitalizationCode: null,
        //         channelHospitalizationCode: null,
        //         informationsDirection: null, // 0
        //         caseGivenYear: null,
        //         hospitalized: null
        //     },
        //     PaymentData: null,
        //     RegistrationNewborn: null, // 0
        //     CertifiedExtract: null,
        //     Services: null,
        //     DisabilityCertificate: null // 0
        // };
        let form = await waitForNull({
            PrimaryInformationAdmission: parseAdmission(thecase, record)
        });
        return form;
    };

    const get066ByIndividual = async d => {
        populateCache();
        let cases = await getCaseByIndividual(d);
        let result = [];
        await Promise.all(
            cases.map(async thecase => {
                if (!thecase) return null;
                if (!thecase.hspRecords ||
                    thecase.stateId === '1' ||
                    thecase.stateId === '2' ||
                    thecase.stateId === '7') return null;
                let data = await waitForNull({
                    careProvidingFormCode: parseForm(thecase.careProvidingFormId)
                });
                if (!data) return null;
                Object.assign(thecase, data, {
                    hspRecords: thecase.hspRecords.hospitalRecord
                });
                await Promise.all(
                    thecase.hspRecords.map(async i => {
                        let data = await parseHspRecord(thecase, i);
                        if (!!data) result = result.concat(data);
                    })
                );
            })
        );
        clearCache();
        return result;
    };

    return {
        get025ByIndividual,
        getCaseByIndividual,
        get066ByIndividual
    };
};

module.exports = {
    /**
     * Форма 025-12/у по UID пациента
     * @param {String} s - конфигурация
     * @param {String} patientUid - UID пациента
     * @return {Promise<Object>}
     */
    async get025ByIndividual(s, patientUid) {
        try {
            const c = await composeLib(s);
            const data = await c.get025ByIndividual(patientUid);
            return data;
        } catch (e) {
            console.error(e);
            return e;
        }
    },

    /**
     * Форма 066 по UID пациента
     * @param {String} s - конфигурация
     * @param {String} patientUid - UID пациента
     * @return {Promise<Object>}
     */
    async get066ByIndividual(s, patientUid) {
        try {
            const c = await composeLib(s);
            const data = await c.get066ByIndividual(patientUid);
            return data;
        } catch (e) {
            console.error(e);
            return e;
        }
    },

    /**
     * Возвращает все случаи по UID физического лица
     * @param {String} s - конфигурация
     * @param {String} patientUid
     * @return {Promise<Object>}
     */
    async getCaseByIndividual(s, patientUid) {
        try {
            const c = await composeLib(s);
            const data = await c.getCaseByIndividual(patientUid);
            return data;
        } catch (e) {
            console.error(e);
            return e;
        }
    }
};

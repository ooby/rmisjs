const getProtocol = require('./protocol');
const document = require('./document');
const refbooks = require('refbooks');
const rmisjs = require('../../index');
const moment = require('moment');
const Queue = require('../../libs/queue');
const soap = require('soap');
const url = require('url');
const j2x = require('js2xmlparser');
const ss = require('string-similarity');

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

const waitForNull = async obj => {
    let valid = true;
    await Promise.all(
        Object.entries(obj).map(async([key, value]) => {
            if (!valid) return;
            value = await value;
            if (value === null) valid = false;
            obj[key] = value;
        })
    );
    return valid ? obj : null;
};

const rbq = new Queue(1);

const composeLib = async s => {
    const docParser = await document(s);
    const dict = new Map();
    const doctors = new Map();
    const documents = new Map();

    const populateCache = () => {
        cacheMappedRefbook('MDP365', '1.0', [1, 3]);
        cacheMappedRefbook('PRK470', '1.0', [0, 1]);
        cacheMappedRefbook('HST0020', '1.0', [0, 1]);
        cacheMappedRefbook('C33001', '1.0', [0, 3]);
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
    const [refbook, employee] = await Promise.all([
        rmis.refbook(),
        rmis.employee()
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
                        part: i + 1
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

    const cacheMappedRefbook = async(code, version, index) =>
        dict.set(code, mapRefbook(code, version, index));

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

    /**
     * Возвращает все случаи по UID физического лица
     * @param {String} patientUid
     * @return {Promise<Object>}
     */
    const getCase = async patientUid => {
        let data = await c.searchCaseAsync({
            patientUid
        });
        if (!data) return null;
        if (!data.cases) return null;
        return data.cases.caseComplex;
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
        if (!positionId) return null;
        let speciality = await employee.getPosition({
            id: positionId
        });
        if (!speciality.position) return null;
        if (!speciality.position.speciality) return null;
        speciality = speciality.position.speciality;
        let specName = await getRefbookValue({
            code: '1.2.643.5.1.13.3.2861820518965.1.1.118',
            version: 'CURRENT',
            col: 'ID',
            val: speciality,
            res: 'NAME'
        });
        return await getCodeByName(await dict.get('C33001'), specName);
    };

    /**
     * Возвращает сведения о враче
     * @param {Object} thecase - случай пациента
     * @param {Object} visit - посещение пацинта
     * @return {Promise<Object>}
     */
    const parseDoctor = async(thecase, visit) => {
        if (!thecase || !visit) return null;
        let docUid = [].concat(visit.Doctor.Patient.patientUid).pop();
        if (doctors.has(docUid)) return doctors.get(docUid);
        let doctor = await waitForNull({
            uid: docUid,
            snils: docParser.getSnils(docUid),
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
        if (!visit.diagnoses) return null;
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
     * @param {Object} date - день посещения
     * @param {Object} time - время посещения
     * @return {String}
     */
    const parseDate = (date, time) => {
        if (!date || !time) return null;
        let dateTime = date.replace(/\+.*$/, '') + 'T';
        dateTime += time || ('00:00:00.000' + moment().format('Z'));
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
        let dateTime = parseDate(visit.admissionDate, visit.admissionTime);
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
        return {
            Service: await Promise.all(
                renderedServices.map(async i => {
                    return {
                        serviceCode: await getCodeByName(data.hst0020, i.serviceName),
                        unitCode: 1, // WRONG
                        quantityServices: renderedServices.length,
                        doctor: data.doctor
                    };
                })
            )
        };
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
            Services: parseService(thecase, visit),
        });
        if (!data) return null;
        let diagnosis = data.diagnosis;
        delete data.diagnosis;
        return {
            Form025: Object.assign(data, diagnosis)
        };
    };

    const parseSummaryVisits = async(thecase, visit) => {
        if (!thecase || !visit) return null;
        if (!visit.diagnoses) return null;
        let data = await waitForNull({
            diagnosis: parseDiagnosis(thecase, visit),
            InformationDisease: waitForNull({
                resultCode: parseVisitResult(visit.visitResultId),
                outcomeCode: parseDiseaseResult(visit.deseaseResultId),
                visit: parseVisit(thecase, visit),
            }),
            paymentData: parsePaymentData(thecase),
            Services: parseService(thecase, visit),
        });
        if (!data) return null;
        let diagnosis = data.diagnosis;
        delete data.diagnosis;
        return {
            AmbulatorySummary: Object.assign(data, diagnosis)
        };
    };

    const parsePatientDocument = async uid => {
        if (!uid) return null;
        let doc = await docParser.searchDocument(uid, '26');
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

    const parseAdmission = async(thecase, record) =>
        waitForNull({
            dateTimeReceipt: parseDate(record.admissionDate, record.admissionTime),
            indicationsHospitalizationCode: thecase.careProvidingFormCode,
            channelHospitalizationCode: 8, // WRONG
            caseGivenYear: record.previousHospitalRecordId ? 2 : 1,
            hospitalized: 1 // WRONG
        });

    const parseHspRecord = async(thecase, record) => {
        let form = await waitForNull({
            PrimaryInformationAdmission: parseAdmission(thecase, record),
            PaymentData: parsePaymentData(thecase),
            // RegistrationNewborn: null, // 0
            CertifiedExtract: parseDiagnosis(thecase, record),
            Services: parseService(thecase, record),
            // DisabilityCertificate: null // 0
        });
        return !form ? null : {
            Form066: form
        };
    };

    const parseExaminatiion = async(thecase, record) => {
        if (!record.renderedServices) return null;
        let services = record.renderedService;
        let result = {};
        await Promise.all(
            services.map(async i => {
                let proto = await getProtocol(i.id);
                if (!proto) return;
                for (let key in proto) {
                    if (key in result === false) result[key] = [];
                    result[key].push(proto[key]);
                }
            })
        );
        for (let key of result) {
            result[key] = result[key].join('; ');
        }
        Object.assign(result, {
            anamnesisLife: { // WRONG
                GeneralBioInfo: '', // WRONG
                socialHistory: '', // WRONG
                familyHistory: '', // WRONG
                riskFactors: '' // WRONG
            },
            ObjectiveData: {
                functionalExamination: {
                    // functionalParameter: [
                    //     {
                    //         nameParameter: null,
                    //         valueParameter: null,
                    //         controlValue: null,
                    //         measuringUnit: null
                    //     }
                    // ]
                }
            },
            provisionalDiagnosis: null,
            planSurvey: '',
            planTreatment: ''
        });
        return result;
    };

    const parseCertifiedExtract = async thecase => {
        let first = thecase.hspRecords[0];
        let dischargeDate = parseDate(first.outcomeDate, first.outcomeTime);
        let admissionDate = parseDate(first.admissionDate, first.admissionTime);
        return await waitForNull({
            dischargeDate,
            numberBedDays: moment(dischargeDate).diff(moment(admissionDate), 'days') + 1,
            ConditionsMedAssistance: 1, // WRONG
            TypeAssistence: 3, // WRONG
            OutcomeCode: parseDiseaseResult(first.diseaseResultId),
            resultСode: parseVisitResult(),
            DiagnosisCertifiedExtract: parseDiagnosis(thecase, first)
        });
    };

    const parseAllServices = async (thecase, records) => {
        let Services = await Promise.all(
            records.map(i => parseService(thecase, i))
        );
        return Services.reduce((r, i) => r.concat(i), []);
    };

    const parseStationarySummary = async thecase => {
        let first = thecase.hspRecords[0];
        return await waitForNull({
            StationarySummary: waitForNull({
                PrimaryInformationAdmission: parseAdmission(thecase, first), // WRONG
                PaymentData: parsePaymentData(thecase),
                CertifiedExtract: parseCertifiedExtract(thecase),
                Services: parseAllServices(thecase, thecase.hspRecords),
                PrimaryExamination: parseExaminatiion(thecase, first),
                Recommendations: '' // WRONG
            })
        });
    };

    const getForms = async d => {
        populateCache();
        let cases = await getCase(d);
        if (!cases) return null;
        let result = [d];
        await Promise.all(
            [].concat(cases).map(async thecase => {
                if (!thecase) return null;
                let hsp = !!thecase.hspRecords;
                let amb = !thecase.hspRecords && thecase.Visits;
                if (hsp === amb) return null;
                if (hsp) {
                    if (!thecase.hspRecords.hospitalRecord) return null;
                    thecase.hspRecords = [].concat(thecase.hspRecords.hospitalRecord);
                } else {
                    if (!thecase.Visits.Visit) return null;
                    thecase.Visits = [].concat(thecase.Visits.Visit);
                }
                let data = {
                    document: parsePatientDocument(thecase.Patient.patientUid),
                    careProvidingFormCode: parseForm(thecase.careProvidingFormId)
                };
                if (amb) {
                    Object.assign(data, {
                        careLevelCode: parseCare(thecase.careLevelId)
                    });
                }
                data = await waitForNull(data);
                if (!data) return null;
                if (amb) thecase.Patient.polis = data.document.number;
                Object.assign(thecase, data);
                let closed = false;
                switch (parseInt(thecase.stateId)) {
                    case 1:
                        closed = true;
                        break;
                    case 2:
                        closed = true;
                        break;
                    case 7:
                        closed = true;
                        break;
                }
                if (hsp && !!thecase.hspRecords[0].outcomeDate) closed = true;
                if (closed) {
                    let data;
                    if (hsp) data = await parseStationarySummary(thecase);
                    else data = await parseSummaryVisits(thecase, thecase.Visits[0]);
                    if (data !== null) result.push(data);
                } else {
                    let iterator = hsp ? parseHspRecord : parse025Visit;
                    let arr = hsp ? thecase.hspRecords : thecase.Visits;
                    await Promise.all(
                        arr.map(async i => {
                            let res = await iterator(thecase, i);
                            if (res !== null) result = result.concat(data);
                        })
                    );
                }
            })
        );
        await clearCache();
        return result;
    };

    return {
        getCase,
        getForms
    };
};

const composeMethod = async(s, method, ...args) => {
    try {
        const c = await composeLib(s);
        return await c[method](...args);
    } catch (e) {
        console.error(e);
        return e;
    }
};

module.exports = {
    /**
     * Возвращает все случаи пациента по его UID.
     * @param {String} s - конфигурация
     * @param {String} patientUid - UID пациента
     * @return {Promise<Object>}
     */
    getCase: (s, patientUid) => composeMethod(s, 'getCase', patientUid),

    /**
     * Возвращает формы для ИЭМК
     * @param {Object} s - конфигурация
     * @param {String} patientUid - UID пациента
     * @return {Promise<Object>}
     */
    getForms: (s, patientUid) => composeMethod(s, 'getForms', patientUid)
};

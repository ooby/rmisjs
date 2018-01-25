const getProtocol = require('../libs/protocol');
const document = require('../libs/document');
const refbook = require('../libs/refbook');
const rmisjs = require('../../index');
const moment = require('moment');
const soap = require('soap');
const url = require('url');
const j2x = require('js2xmlparser');

const wsdl = '/carbondss/services/MedbaseCases/MedbaseCases.SecureSOAP11Endpoint.xml';
const endpoint = '/carbondss/services/MedbaseCases.SOAP11Endpoint/';

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
    try {
        let result = await Promise.all(Object.values(obj));
        for (let key of Object.keys(obj)) obj[key] = await obj[key];
        return obj;
    } catch (e) {
        if (e !== null) throw e;
        return null;
    }
};

const keys = {
    MDP365: {
        code: 'MDP365',
        version: '1.0',
        indexes: [1, 3]
    },
    PRK470: {
        code: 'PRK470',
        version: '1.0',
        indexes: [0, 1]
    },
    HST0020: {
        code: 'HST0020',
        version: '1.0',
        indexes: [0, 1]
    },
    C33001: {
        code: 'C33001',
        version: '1.0',
        indexes: [0, 3]
    }
};

const $ = (data, path, def) => {
    if (!data) return def;
    if (!path) return data || def;
    if (path) {
        for (let i of path.split('.')) {
            if (i in data == false) return def;
            data = data[i];
            if (!data) return def;
        }
    }
    data = [].concat(data).pop();
    return data || def;
};

const $$ = (data, path, def) => {
    if (!data) return def;
    if (!path) return data || def;
    if (path) {
        for (let i of path.split('.')) {
            if (i in data == false) return def;
            data = data[i];
            if (!data) return def;
        }
    }
    data = [].concat(data);
    return data || def;
};

module.exports = async s => {
    const docParser = await document(s);
    const doctors = new Map();
    const rb = await refbook(s);

    const clearCache = () => {
        doctors.clear();
        docParser.clearCache();
        rb.clearCache();
    };

    const c = await soap.createClientAsync(url.resolve(s.rmis.path, wsdl), {
        endpoint: url.resolve(s.rmis.path, endpoint)
    });
    c.setSecurity(new soap.BasicAuthSecurity(s.rmis.auth.username, s.rmis.auth.password));

    const rmis = await rmisjs(s).rmis;
    const employee = await rmis.employee();

    /**
     * Возвращает все случаи по UID физического лица
     * @param {String} d - параметры
     * @return {Promise<Object>}
     */
    const getCase = async d => {
        let data = await c.searchCaseAsync(d);
        return $$(data, 'cases.caseComplex', null);
    };

    /**
     * Возвращает код должности врача по названию должности
     * @param {String} positionName
     * @return {Promise<String>}
     */
    const parseDoctorPost = async positionName => {
        if (!positionName) return Promise.reject(null);
        let code = await rb.getCodeNSI(positionName, keys['MDP365']);
        return !code ? Promise.reject(null) : code;
    };

    /**
     * Возвращает код специальности врача по ID должности
     * @param {String | Number} positionId
     * @return {Promise<Object>}
     */
    const parseDoctorSpec = async positionId => {
        if (!positionId) return Promise.reject(null);
        let speciality = await employee.getPosition({
            id: positionId
        });
        speciality = $(speciality, 'position.speciality');
        if (!speciality) return Promise.reject(null);
        let specName = await rb.getValueRMIS('pim_speciality', 'ID', speciality, 'NAME');
        if (!specName) return Promise.reject(null);
        let specCode = await rb.getCodeNSI(specName, keys['C33001']);
        return specCode || Promise.reject(null);
    };

    const parseSnils = async uid => {
        let doc = $(await docParser.searchSnils(uid), 'number', null);
        if (!doc) return Promise.reject(null);
        if (/^\d{3}-\d{3}-\d{3}\s\d{2}$/.test(doc)) return doc;
        if (/^\d{11}$/.test(doc)) {
            return [
                [doc.slice(0, 3), doc.slice(3, 6), doc.slice(6, 9)].join('-'),
                doc.slice(9, 11)
            ].join(' ');
        }
        return Promise.reject(null);
    };

    /**
     * Возвращает сведения о враче
     * @param {Object} thecase - случай пациента
     * @param {Object} visit - посещение пацинта
     * @return {Promise<Object>}
     */
    const parseDoctor = async(thecase, visit) => {
        if (!thecase || !visit) return Promise.reject(null);
        let docUid = $(visit, 'Doctor.Patient.patientUid', null);
        if (!docUid) return Promise.reject(null);
        if (doctors.has(docUid)) return doctors.get(docUid);
        let doctor = await waitForNull({
            uid: docUid,
            snils: parseSnils(docUid),
            postCode: parseDoctorPost($(visit, 'Doctor.positionName')),
            specialityCode: parseDoctorSpec($(visit, 'Doctor.positionId'))
        });
        if (!doctor) return Promise.reject(null);
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
        if (!thecase || !visit) return Promise.reject(null);
        if (!visit.diagnoses) return Promise.reject(null);
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
        if (!mainDiagnosisCode || !characterDiagnosisCode) return Promise.reject(null);
        return {
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
        if (!date || !time) return Promise.reject(null);
        let dateTime = date.replace(/\+.*$/, '') + 'T';
        dateTime += time || ('00:00:00.000' + moment().format('Z'));
        return dateTime;
    };

    const parsePaymentData = async thecase => {
        if (!thecase) return Promise.reject(null);
        let paymentData = await waitForNull({
            typePaymentCode: $(thecase, 'fundingSourceTypeId'),
            policyNumber: thecase.Patient.polis,
            insuranceCompanyCode: $(thecase, 'document.issuerCode')
        });
        let funding = parseInt($(thecase, 'fundingSourceTypeId'));
        if (!funding) return Promise.reject(null);
        if (funding === 2) return Promise.reject(null);
        if (funding === 5) paymentData.typePaymentCode = '2';
        if ('policyNumber' in paymentData) delete paymentData.policyNumber;
        return paymentData;
    };

    const parseVisit = (thecase, visit) => {
        if (!thecase || !visit) return Promise.reject(null);
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
        if (!thecase || !visit) return Promise.reject(null);
        let doctor = await parseDoctor(thecase, visit);
        if (!doctor) return Promise.reject(null);
        let renderedServices = visit.renderedServices ? [].concat(visit.renderedServices.renderedService) : [];
        return {
            Service: await Promise.all(
                renderedServices.map(async i => {
                    return {
                        serviceCode: await rb.getCodeNSI(i.serviceName, keys['HST0020']),
                        unitCode: 1, // WRONG
                        quantityServices: renderedServices.length,
                        doctor
                    };
                })
            )
        };
    };

    const parseVisitResult = resultId => {
        if (!resultId) return Promise.reject(null);
        return rb.getValueRMIS('mc_step_result', 'ID', resultId, 'CODE');
    };

    const parseDiseaseResult = deseaseResultId => {
        if (!deseaseResultId) return Promise.reject(null);
        return rb.getValueRMIS('mc_step_care_result', 'ID', deseaseResultId, 'CODE');
    };

    const parse025Visit = async(thecase, visit) => {
        if (!thecase || !visit) return Promise.reject(null);
        if (!visit.diagnoses) return Promise.reject(null);
        let data = await waitForNull({
            diagnosis: parseDiagnosis(thecase, visit),
            resultCode: parseVisitResult(visit.visitResultId),
            outcomeCode: parseDiseaseResult(visit.deseaseResultId),
            visit: parseVisit(thecase, visit),
            PaymentData: parsePaymentData(thecase),
            Services: parseService(thecase, visit),
        });
        if (!data) return Promise.reject(null);
        let diagnosis = data.diagnosis;
        delete data.diagnosis;
        return {
            root: 'Form025',
            form: Object.assign(data, diagnosis)
        };
    };

    const parseAmbulatorySummary = async(thecase, visit) => {
        if (!thecase || !visit) return Promise.reject(null);
        if (!visit.diagnoses) return Promise.reject(null);
        let data = await waitForNull({
            PaymentData: parsePaymentData(thecase),
            diagnosis: parseDiagnosis(thecase, visit),
            InformationDisease: waitForNull({
                resultCode: parseVisitResult(visit.visitResultId),
                outcomeCode: parseDiseaseResult(visit.deseaseResultId),
                visit: parseVisit(thecase, visit),
            }),
            PrimaryExamination: parseExaminatiion(thecase, visit),
            Services: parseService(thecase, visit),
        });
        if (!data) return Promise.reject(null);
        let diagnosis = data.diagnosis;
        delete data.diagnosis;
        return {
            root: 'AmbulatorySummary',
            form: Object.assign(data, diagnosis)
        };
    };

    const parsePatientDocument = async uid => {
        if (!uid) return Promise.reject(null);
        let doc = await docParser.searchPolis(uid);
        if (!doc) return Promise.reject(null);
        doc.issuerCode = await rb.getValueRMIS('pim_organization', 'ID', doc.issuer, 'CODE');
        return doc;
    };

    const parseForm = async careProvidingFormId => {
        if (!careProvidingFormId) return Promise.reject(null);
        let name = await rb.getValueRMIS('md_care_providing_form', 'ID', careProvidingFormId, 'NAME');
        if (!name) return Promise.reject(null);
        let code = await rb.getCodeNSI(name, keys['PRK470']);
        return code;
    };

    const parseCare = async careLevelId => {
        let code = await rb.getValueRMIS('mc_care_level', 'ID', careLevelId, 'CODE');
        if (!code) return Promise.reject(null);
        return code;
    };

    const parseAdmission = (thecase, record) =>
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
            root: 'Form066',
            form
        };
    };

    const parseExaminatiion = async(thecase, record) => {
        if (!record.renderedServices) return Promise.reject(null);
        let services = [].concat(record.renderedService);
        if (services.length === 0) return Promise.reject(null);
        let result = {};
        await Promise.all(
            services.map(async i => {
                if (!i) return;
                let proto = await getProtocol(i.id);
                if (!proto) return;
                for (let key in proto) {
                    if (key in result === false) result[key] = [];
                    result[key].push(proto[key]);
                }
            })
        );
        for (let key of Object.keys(result)) {
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
                    functionalParameter: [
                        {
                            nameParameter: '',
                            valueParameter: '',
                            controlValue: '',
                            measuringUnit: ''
                        }
                    ]
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

    const parseAllServices = async(thecase, records) => {
        let Services = await Promise.all(
            records.map(i => parseService(thecase, i))
        );
        return Services.reduce((r, i) => r.concat(i), []);
    };

    const parseStationarySummary = async thecase => {
        let first = thecase.hspRecords[0];
        return {
            root: 'StationarySummary',
            form: await waitForNull({
                PrimaryInformationAdmission: parseAdmission(thecase, first), // WRONG
                PaymentData: parsePaymentData(thecase),
                CertifiedExtract: parseCertifiedExtract(thecase),
                Services: parseAllServices(thecase, thecase.hspRecords),
                PrimaryExamination: parseExaminatiion(thecase, first),
                Recommendations: '' // WRONG
            })
        };
    };

    const getForms = async(patientUid, lastDate) => {
        const cases = await getCase({
            patientUid
        });
        if (!cases) return;
        let result = [];
        await Promise.all(
            cases.map(async thecase => {
                let hsp = !!thecase.hspRecords;
                let amb = !thecase.hspRecords && thecase.Visits;
                if (hsp === amb) return;
                if (hsp) {
                    thecase.hspRecords = $$(thecase, 'hspRecords.hospitalRecord', null);
                    if (!thecase.hspRecords) return;
                } else {
                    thecase.Visits = $$(thecase, 'Visits.Visit', null);
                    if (!thecase.Visits) return;
                }
                let data = waitForNull(
                    Object.assign({
                        document: parsePatientDocument(thecase.Patient.patientUid),
                        careProvidingFormCode: parseForm(thecase.careProvidingFormId)
                    }, amb ? {
                        careLevelCode: parseCare(thecase.careLevelId)
                    } : {})
                );
                let closed = false;
                if (hsp && !!thecase.hspRecords[0].outcomeDate) closed = true;
                else {
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
                }
                let meta = {
                    patientId: patientUid,
                    caseId: thecase.id,
                    date: moment(thecase.createdDate, 'YYYY-MM-DDZ').toDate()
                };
                data = await data;
                if (!data) return;
                Object.assign(thecase, data);
                thecase.Patient.polis = data.document.number;
                let records = hsp ? thecase.hspRecords : thecase.Visits;
                let parser;
                if (closed) {
                    parser = hsp ? parseStationarySummary : parseAmbulatorySummary;
                    if (lastDate) {
                        let thedate = (
                            records.map(i =>
                                moment(parseDate(i.admissionDate, i.admissionTime))
                                .toDate()
                                .valueOf()
                            )
                            .sort((a, b) => a - b)
                            .pop()
                        );
                        if (thedate <= lastDate.valueOf()) return;
                    }
                    try {
                        let data = await parser(thecase, records[0]);
                        if (!data) return;
                        result.push(Object.assign(data, meta));
                    } catch (e) {
                        if (e !== null) throw e;
                    }
                } else {
                    parser = hsp ? parseHspRecord : parse025Visit;
                    records = await Promise.all(
                        records.map(async i => {
                            let thedate = moment(parseDate(i.admissionDate, i.admissionTime)).toDate();
                            if (lastDate && lastDate.valueOf() >= thedate.valueOf()) return null;
                            try {
                                let res = await parser(thecase, i);
                                return !res ? null : Object.assign(res, meta);
                            } catch (e) {
                                if (e !== null) throw e;
                                return null;
                            }
                        })
                    );
                    result.concat(records.filter(i => !!i));
                }
            })
        );
        return result;
    };

    return {
        /**
         * Возвращает все случаи пациента по его UID.
         * @param {String} d - параметры
         * @return {Promise<Object>}
         */
        getCase: d =>
            getCase(patientUid)
            .catch(e => console.error(e)),

        /**
         * Возвращает формы для ИЭМК
         * @param {String} patientUid - UID пациента
         * @param {Date} [lastDate] - дата последней выгрузки
         * @return {Promise<Object>}
         */
        getForms: (patientUid, lastDate) =>
            getForms(patientUid, lastDate)
            .catch(e => console.error(e)),

        clearCache
    };
};

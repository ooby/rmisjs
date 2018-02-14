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

const waitForObject = async obj => {
    let entries = Object.entries(obj).filter(([k, v]) => v instanceof Promise);
    await Promise.all(entries.map(([k, v]) => v));
    for (let [k, v] of entries) {
        obj[k] = await v;
    }
    return obj;
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

const missing = name => {
    console.log(new Date().toString(), name);
    return Promise.reject({
        missingData: name
    });
};

module.exports = async s => {
    const docParser = await document(s);
    const doctors = new Map();
    const rb = await refbook(s);

    const clearCache = {
        doctors: () => doctors.clear(),
        docParser: () => docParser.clearCache(),
        refbooks: () => rb.clearCache()
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
        if (!positionName) return missing('No doctor position name');
        let code = await rb.getCodeNSI(positionName, keys['MDP365']);
        return !code ? missing('No doctor post code') : code;
    };

    /**
     * Возвращает код специальности врача по ID должности
     * @param {String | Number} positionId
     * @return {Promise<Object>}
     */
    const parseDoctorSpec = async positionId => {
        if (!positionId) return missing('No doctor position id');
        let speciality = await employee.getPosition({
            id: positionId
        });
        speciality = $(speciality, 'position.speciality');
        if (!speciality) return missing('No doctor speciality');
        let specName = await rb.getValueRMIS('pim_speciality', 'ID', speciality, 'NAME');
        if (!specName) return missing('No doctor speciality name');
        let specCode = await rb.getCodeNSI(specName, keys['C33001']);
        return specCode || missing('No doctor speciality code');
    };

    const parseSnils = async uid => {
        let doc = $(await docParser.searchSnils(uid), 'number', null);
        if (!doc) return missing('No snils');
        if (/^\d{3}-\d{3}-\d{3}\s\d{2}$/.test(doc)) return doc;
        if (/^\d{11}$/.test(doc)) {
            return [
                [doc.slice(0, 3), doc.slice(3, 6), doc.slice(6, 9)].join('-'),
                doc.slice(9, 11)
            ].join(' ');
        }
        return missing('No snils');
    };

    /**
     * Возвращает сведения о враче
     * @param {Object} thecase - случай пациента
     * @param {Object} visit - посещение пацинта
     * @return {Promise<Object>}
     */
    const parseDoctor = async (thecase, visit) => {
        if (!thecase || !visit) return missing('No case or no visit while parsing doctor');
        let docUid = $(visit, 'Doctor.Patient.patientUid', null);
        if (!docUid) return missing('No doctor UID');
        if (doctors.has(docUid)) return doctors.get(docUid);
        let doctor = await waitForObject({
            uid: Promise.resolve(docUid),
            snils: parseSnils(docUid),
            postCode: parseDoctorPost($(visit, 'Doctor.positionName')),
            specialtyCode: parseDoctorSpec($(visit, 'Doctor.positionId'))
        });
        if (!doctor) return missing('No doctor');
        doctors.set(docUid, doctor);
        return doctor;
    };

    /**
     * Возвращает объект с полями диагнозов
     * @param {Object} thecase - случай
     * @param {Object} visit - посещение
     * @return {Promise<Object>} - поля диагнозов
     */
    const parseDiagnosis = async (thecase, visit) => {
        if (!thecase || !visit) return missing('No case or no record while parsing diagnosis');
        let diagnoses = $$(visit, 'diagnoses.diagnos', null);
        if (diagnoses == null) return missing('No diagnoses');
        let mainDiagnosisCode = null;
        let characterDiagnosisCode = null;
        let concomitantDiagnosis = [];
        for (let diagnosis of diagnoses) {
            if (diagnosis.typeId === '2') {
                concomitantDiagnosis.push(diagnosis.diagnosMKB);
            } else if (diagnosis.typeId === '1' || diagnosis.typeId === '3') {
                mainDiagnosisCode = diagnosis.diagnosMKB;
            }
            if (!characterDiagnosisCode || characterDiagnosisCode === 99) {
                characterDiagnosisCode = deseaseTypeMatch(diagnosis.deseaseTypeId, diagnosis.injuryTypeId);
            }
        }
        if (mainDiagnosisCode == null || characterDiagnosisCode == null) {
            let diagnosis = diagnoses.shift();
            if (!diagnosis) return missing('No diagnoses\' codes');
            mainDiagnosisCode = diagnosis.diagnosMKB;
            characterDiagnosisCode = deseaseTypeMatch(diagnosis.deseaseTypeId, diagnosis.injuryTypeId);
            concomitantDiagnosis = [];
            for (let diagnosis of diagnoses) concomitantDiagnosis.push(diagnosis.diagnosMKB);
        }
        if (mainDiagnosisCode == null || characterDiagnosisCode == null) {
            return missing('No diagnoses\' codes');
        }
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
     * @return {Promise<String>}
     */
    const parseDate = (date, time) => {
        if (!date) return missing('No date');
        if (date && !time) return Promise.resolve(date);
        let dateTime = date.replace(/\+.*$/, '') + 'T';
        dateTime += time || ('00:00:00.000' + moment().format('Z'));
        return Promise.resolve(dateTime);
    };

    const parsePaymentData = thecase => {
        if (!thecase) return missing('No case while parsing payment data');
        let paymentData = {
            typePaymentCode: $(thecase, 'fundingSourceTypeId'),
            policyNumber: thecase.Patient.polis,
            insuranceCompanyCode: $(thecase, 'document.issuerCode')
        };
        let funding = parseInt($(thecase, 'fundingSourceTypeId'));
        if (!funding || funding === 2) return missing('No funding type ID');
        if (funding === 5) paymentData.typePaymentCode = '2';
        return Promise.resolve(paymentData);
    };

    const parseVisit = async (thecase, visit) => {
        if (!thecase || !visit) return missing('No case or no record while parsing visits');
        let dateTime = await parseDate(visit.admissionDate, visit.admissionTime);
        return !dateTime ? null : {
            dateTime,
            placeServicesCode: visit.placeId,
            purposeVisitCode: visit.goalId,
            typeTreatmentCode: !visit.repeated ? '2' : '1',
            typeAssistanceCode: thecase.careLevelCode,
            formCode: thecase.careProvidingFormCode
        };
    };

    const parseService = async (thecase, visit) => {
        if (!thecase || !visit) return missing('No case or no record while parsing services');
        let doctor = await parseDoctor(thecase, visit);
        if (!doctor) return missing('No doctor while parsing services');
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

    const parseVisitResult = async resultId => {
        if (!resultId) return missing('No result ID');
        return rb.getValueRMIS('mc_step_result', 'ID', resultId, 'CODE');
    };

    const parseDiseaseResult = async deseaseResultId => {
        if (!deseaseResultId) return missing('No result disease ID');
        return rb.getValueRMIS('mc_step_care_result', 'ID', deseaseResultId, 'CODE');
    };

    const parse025Visit = async (thecase, visit) => {
        if (!thecase || !visit) return missing('No case or no visit while parsing form 025');
        if (!visit.diagnoses) return missing('No diagnoses');
        let data = await waitForObject({
            diagnosis: parseDiagnosis(thecase, visit),
            resultCode: parseVisitResult(visit.visitResultId),
            outcomeCode: parseDiseaseResult(visit.deseaseResultId),
            visit: parseVisit(thecase, visit),
            PaymentData: parsePaymentData(thecase),
            Services: parseService(thecase, visit),
        });
        if (!data) return missing('No form data');
        let diagnosis = data.diagnosis;
        delete data.diagnosis;
        return {
            root: 'Form025',
            form: Object.assign(data, diagnosis)
        };
    };

    const parseAmbulatorySummary = async (thecase, visit) => {
        if (!thecase || !visit) return missing('No case or no visit while parsing AbulatorySummary');
        if (!visit.diagnoses) return missing('No diagnoses');
        let data = await waitForObject({
            PaymentData: parsePaymentData(thecase),
            diagnosis: parseDiagnosis(thecase, visit),
            InformationDisease: waitForObject({
                resultCode: parseVisitResult(visit.visitResultId),
                outcomeCode: parseDiseaseResult(visit.deseaseResultId),
                visit: parseVisit(thecase, visit),
            }),
            PrimaryExamination: parseExaminatiion(thecase, visit),
            Services: parseService(thecase, visit),
        });
        if (!data) return missing('No form data');
        let diagnosis = data.diagnosis;
        delete data.diagnosis;
        return {
            root: 'AmbulatorySummary',
            form: Object.assign(data, diagnosis)
        };
    };

    const parsePatientDocument = async uid => {
        if (!uid) return missing('No patient UID');
        let doc = await docParser.searchPolis(uid);
        if (!doc) return missing('No polis');
        doc.issuerCode = await rb.getValueRMIS('pim_organization', 'ID', doc.issuer, 'CODE');
        return doc;
    };

    const parseForm = async careProvidingFormId => {
        if (careProvidingFormId === '0') careProvidingFormId = '3';
        if (!careProvidingFormId) return missing('No form ID');
        let name = await rb.getValueRMIS('md_care_providing_form', 'ID', careProvidingFormId, 'NAME');
        if (!name) return missing('No form name');
        let code = await rb.getCodeNSI(name, keys['PRK470']);
        if (!code) return missing('No form code');
        return code;
    };

    const parseCare = async careLevelId => {
        let code = await rb.getValueRMIS('mc_care_level', 'ID', careLevelId, 'CODE');
        if (!code) return missing('No care code');
        return code;
    };

    const parseAdmission = async (thecase, record) => {
        let date = await parseDate(record.admissionDate, record.admissionTime);
        return Object.assign({
            indicationsHospitalizationCode: thecase.careProvidingFormCode,
            channelHospitalizationCode: 8, // WRONG
            caseGivenYear: record.previousHospitalRecordId ? 2 : 1,
            hospitalized: 1 // WRONG
        }, {
            dateTimeReceipt: date
        });
    };

    const parseHspRecord = async (thecase, record) => {
        let form = await waitForObject({
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

    const parseExaminatiion = async (thecase, record) => {
        if (!record.renderedServices) return missing('No services');
        let services = [].concat(record.renderedService);
        if (services.length === 0) return missing('No services');
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
                GeneralBioInfo: 'нет', // WRONG
                socialHistory: 'нет', // WRONG
                familyHistory: 'нет', // WRONG
                riskFactors: 'нет' // WRONG
            },
            ObjectiveData: {
                functionalExamination: {
                    functionalParameter: [{
                        nameParameter: 'нет',
                        valueParameter: 'нет',
                        controlValue: 'нет',
                        measuringUnit: 'нет'
                    }]
                }
            },
            provisionalDiagnosis: 'нет',
            planSurvey: 'нет',
            planTreatment: 'нет'
        });
        return result;
    };

    const parseNumberBedDays = async (admissionDate, admissionTime, dischargeDate, dischargeTime) => {
        let [admission, discharge] = await Promise.all([
            parseDate(admissionDate, admissionTime),
            parseDate(dischargeDate, dischargeTime)
        ]);
        let dischargeMoment = dischargeTime ? moment(discharge) : moment(discharge, 'YYYY-MM-DDZ');
        let admissionMoment = admissionTime ? moment(admission) : moment(admission, 'YYYY-MM-DDZ');
        let numberBedDays = dischargeMoment.diff(admissionMoment, 'days') + 1;
        return {
            numberBedDays,
            discharge,
            admission
        };
    };

    const parseCertifiedExtract = async thecase => {
        let first = thecase.records[0];
        let {
            discharge,
            admission,
            numberBedDays
        } = await parseNumberBedDays(first.admissionDate, first.admissionTime, first.outcomeDate, first.outcomeTime);
        return await waitForObject({
            dischargeDate: Promise.resolve(discharge),
            numberBedDays: Promise.resolve(numberBedDays),
            ConditionsMedAssistance: Promise.resolve(1), // WRONG
            TypeAssistence: Promise.resolve(3), // WRONG
            OutcomeCode: parseDiseaseResult(first.diseaseResultId),
            resultСode: parseVisitResult(first.visitResultId || first.hspRecordResultId),
            DiagnosisCertifiedExtract: parseDiagnosis(thecase, first)
        });
    };

    const parseAllServices = async thecase => {
        let Services = await Promise.all(
            thecase.records.map(i => parseService(thecase, i))
        );
        return Services.reduce((r, i) => r.concat(i), []);
    };

    const parseStationarySummary = async thecase => {
        let first = thecase.records[0];
        return {
            root: 'StationarySummary',
            form: await waitForObject({
                PrimaryInformationAdmission: parseAdmission(thecase, first), // WRONG
                PaymentData: parsePaymentData(thecase),
                CertifiedExtract: parseCertifiedExtract(thecase),
                Services: parseAllServices(thecase),
                PrimaryExamination: parseExaminatiion(thecase, first),
                Recommendations: Promise.resolve('') // WRONG
            })
        };
    };

    const getForms = async (patientUid, lastDate) => {
        const cases = await getCase(
            Object.assign({
                patientUid
            }, lastDate ? {
                dateStepFrom: moment(lastDate).format('YYYY-MM-DD')
            } : {})
        );
        if (!cases) return;
        let result = [];
        await Promise.all(
            cases.map(async thecase => {
                let hsp = !!thecase.hspRecords;
                let amb = !thecase.hspRecords && thecase.Visits;
                thecase.records = $$(thecase, hsp ? 'hspRecords.hospitalRecord' : 'Visits.Visit', null);
                if (!thecase.records) return;
                let closed = false;
                if (hsp && !!thecase.records[0].outcomeDate) closed = true;
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
                let data;
                try {
                    data = await waitForObject(
                        Object.assign({
                            document: parsePatientDocument(thecase.Patient.patientUid),
                            careProvidingFormCode: parseForm(thecase.careProvidingFormId)
                        }, amb ? {
                            careLevelCode: parseCare(thecase.careLevelId)
                        } : {})
                    );
                } catch (e) {
                    if (!e.missingData) throw e;
                    data = null;
                }
                if (!data) return;
                Object.assign(thecase, data);
                thecase.Patient.polis = data.document.number;
                let parser;
                if (closed) {
                    parser = hsp ? parseStationarySummary : parseAmbulatorySummary;
                    try {
                        let data = await parser(thecase, thecase.records[0]);
                        if (!data) return;
                        result.push(Object.assign(data, meta));
                    } catch (e) {
                        if (!e.missingData) throw e;
                    }
                } else {
                    parser = hsp ? parseHspRecord : parse025Visit;
                    thecase.records = await Promise.all(
                        thecase.records.map(async i => {
                            try {
                                let res = await parser(thecase, i);
                                return !res ? null : Object.assign(res, meta);
                            } catch (e) {
                                if (!e.missingData) throw e;
                            }
                        })
                    );
                    result.concat(thecase.records.filter(i => !!i));
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

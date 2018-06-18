const document = require('../libs/document');
const refbook = require('../libs/refbook');
const rmisjs = require('../../index');
const moment = require('moment');
const soap = require('soap');
const url = require('url');

const wsdl = '/carbondss/services/MedbaseCases/MedbaseCases.SecureSOAP11Endpoint.xml';
const endpoint = '/carbondss/services/MedbaseCases.SOAP11Endpoint/';

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
        indexes: [2, 3]
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
        let [data] = await c.searchCaseAsync(d);
        return $$(data, 'cases.caseComplex', null);
    };

    /**
     * Возвращает код должности врача по названию должности
     * @param {String} positionName
     * @return {Promise<String>}
     */
    const parseDoctorPost = async positionName => {
        if (!positionName) return missing('No doctor position name');
        let key = keys['MDP365'];
        let code = {
            '_attributes': { version: key.version },
            '_text': await rb.getCodeNSI(positionName, key)
        };
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
        let specName = await rb.getRowRMIS('pim_speciality', 'ID', speciality, 'NAME');
        if (!specName) return missing('No doctor speciality name');
        let key = keys['C33001'];
        let specCode = {
            '_attributes': { version: key.version },
            '_text': await rb.getCodeNSI(specName, key)
        };
        return specCode || missing('No doctor speciality code');
    };

    const parseSnils = async uid => {
        let doc = $(await docParser.searchSnils(uid), 'number', null);
        if (!doc) return missing('No snils');
        if (/^\d{3}-\d{3}-\d{3}\s\d{2}$/.test(doc)) return doc.replace(/[-\s]/g, '');
        if (/^\d{11}$/.test(doc)) return doc;
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
        let concomitantDiagnosis = new Set();
        for (let diagnosis of diagnoses) {
            if (diagnosis.typeId === '2') {
                concomitantDiagnosis.add(diagnosis.diagnosMKB);
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
            concomitantDiagnosis = new Set();
            for (let diagnosis of diagnoses) concomitantDiagnosis.add(diagnosis.diagnosMKB);
        }
        if (mainDiagnosisCode == null || characterDiagnosisCode == null) {
            return missing('No diagnoses\' codes');
        }
        concomitantDiagnosis.delete(mainDiagnosisCode);
        return {
            mainDiagnosisCode: {
                '_attributes': { version: '1.0' },
                '_text': mainDiagnosisCode
            },
            characterDiagnosisCode: {
                '_attributes': { version: '1.0' },
                '_text': characterDiagnosisCode
            },
            concomitantDiagnosis: Array.from(concomitantDiagnosis)
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
        let dateTime = date.replace(/\+.*$/, '') + 'T';
        dateTime += time || ('00:00:00.000' + moment().format('Z'));
        return Promise.resolve(moment.utc(dateTime).toISOString());
    };

    const parsePaymentData = thecase => {
        if (!thecase) return missing('No case while parsing payment data');
        let paymentData = {
            typePaymentCode: {
                '_attributes': { version: '1.0' },
                '_text': $(thecase, 'fundingSourceTypeId')
            },
            policyNumber: thecase.Patient.polis,
            insuranceCompanyCode: {
                '_attributes': { version: '1.0' },
                '_text': $(thecase, 'document.issuerCode')
            }
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
            placeServicesCode: {
                '_attributes': { version: '1.0' },
                '_text': visit.placeId
            },
            purposeVisitCode: {
                '_attributes': { version: '1.0' },
                '_text': visit.goalId
            },
            typeTreatmentCode: {
                '_attributes': { version: '1.0' },
                '_text': !visit.repeated ? '2' : '1'
            },
            typeAssistanceCode: {
                '_attributes': { version: '1.0' },
                '_text': thecase.careLevelCode
            },
            formCode: thecase.careProvidingFormCode
        };
    };

    const parseService = async (thecase, visit) => {
        if (!thecase || !visit) return missing('No case or no record while parsing services');
        let doctor = await parseDoctor(thecase, visit);
        if (!doctor) return missing('No doctor while parsing services');
        let renderedServices = visit.renderedServices ? [].concat(visit.renderedServices.renderedService) : [];
        let key = 'HST0020';
        return {
            Service: await Promise.all(
                renderedServices.map(i =>
                    waitForObject({
                        serviceCode: waitForObject({
                            serviceDictionary: Promise.resolve(key),
                            Code: waitForObject({
                                '_attributes': Promise.resolve({ version: keys[key].version }),
                                '_text': rb.getCodeNSI(i.serviceName, keys[key])
                            })
                        }),
                        unitCode: Promise.resolve({
                            '_attributes': { version: '1.0' },
                            '_text': 1, // WRONG
                        }),
                        quantityServices: Promise.resolve(renderedServices.length),
                        PaymentData: parsePaymentData(thecase),
                        doctor: Promise.resolve(doctor)
                    })
                )
            )
        };
    };

    const parseVisitResult = async resultId => {
        if (!resultId) return missing('No result ID');
        return {
            '_attributes': { version: '1.0' },
            '_text': await rb.getRowRMIS('mc_step_result', 'ID', resultId, 'CODE')
        };
    };

    const parseDiseaseResult = async deseaseResultId => {
        if (!deseaseResultId) return missing('No result disease ID');
        return {
            '_attributes': { version: '1.0' },
            '_text': await rb.getRowRMIS('mc_step_care_result', 'ID', deseaseResultId, 'CODE')
        };
    };

    const parse025Visit = async (thecase, visit) => {
        if (!thecase || !visit) return missing('No case or no visit while parsing form 025');
        let diagnosis = await parseDiagnosis(thecase, visit);
        if (!diagnosis) return missing('No form data');
        let data = await waitForObject({
            visit: parseVisit(thecase, visit),
            mainDiagnosisCode: Promise.resolve(diagnosis.mainDiagnosisCode),
            characterDiagnosisCode: Promise.resolve(diagnosis.characterDiagnosisCode),
            Services: parseService(thecase, visit),
            resultCode: parseVisitResult(visit.visitResultId),
            outcomeCode: parseDiseaseResult(visit.deseaseResultId)
        });
        if (!data) return missing('No form data');
        delete data.diagnosis;
        return {
            root: 'Form025',
            form: data
        };
    };

    const parseAmbulatorySummary = async (thecase, visit) => {
        if (!thecase || !visit) return missing('No case or no visit while parsing AbulatorySummary');
        let diagnosis = await parseDiagnosis(thecase, visit);
        if (!diagnosis) return missing('No form data');
        let data = await waitForObject({
            mainDiagnosisCode: Promise.resolve(diagnosis.mainDiagnosisCode),
            characterDiagnosisCode: Promise.resolve(diagnosis.characterDiagnosisCode),
            Services: parseService(thecase, visit),
            InformationDisease: waitForObject({
                Visit: Promise.all(
                    thecase.records.map(i =>
                        parseVisit(thecase, i)
                    )
                ),
                ResultDisease: parseVisitResult(visit.visitResultId),
                OutcomeDisease: parseDiseaseResult(visit.deseaseResultId)
            }),
            PrimaryExamination: parseExamination(thecase, visit),
            informationTreatment: Promise.resolve('n/a')
        });
        if (!data) return missing('No form data');
        return {
            root: 'AmbulatorySummary',
            form: data
        };
    };

    const parsePatientDocument = async uid => {
        if (!uid) return missing('No patient UID');
        let doc = await docParser.searchPolis(uid);
        if (!doc) return missing('No polis');
        doc.issuerCode = await rb.getRowRMIS('pim_organization', 'ID', doc.issuer, 'CODE');
        return doc;
    };

    const parseForm = async careProvidingFormId => {
        if (careProvidingFormId === '0') careProvidingFormId = '3';
        if (!careProvidingFormId) return missing('No form ID');
        let name = await rb.getRowRMIS('md_care_providing_form', 'ID', careProvidingFormId, 'NAME');
        if (!name) return missing('No form name');
        let key = keys['PRK470'];
        let code = {
            '_attributes': { version: key.version },
            '_text': await rb.getCodeNSI(name, key)
        };
        if (!code['_text']) return missing('No form code');
        return code;
    };

    const parseCare = async careLevelId => {
        let code = await rb.getRowRMIS('mc_care_level', 'ID', careLevelId, 'CODE');
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
        }, { dateTimeReceipt: date });
    };

    const parseHspRecord = async (thecase, record) => {
        let data = await waitForObject({
            PrimaryInformationAdmission: parseAdmission(thecase, record),
            // RegistrationNewborn: null, // 0
            CertifiedExtract: parseCertifiedExtract(thecase),
            Services: parseService(thecase, record),
            // DisabilityCertificate: null // 0
        });
        if (!data) return missing('No form data');
        return {
            root: 'Form066',
            form: data
        };
    };

    // WRONG
    const parseExamination = async (thecase, record) => {
        let diagnosis = await parseDiagnosis(thecase, record);
        return {
            complaining: 'n/a',
            anamnesisDisease: {
                historyDisease: 'n/a'
            },
            anamnesisLife: {
                GeneralBioInfo: 'n/a',
                socialHistory: 'n/a',
                familyHistory: 'n/a',
                riskFactors: 'n/a'
            },
            ObjectiveData: {
                functionalExamination: {
                    functionalParameter: [{
                        nameParameter: {
                            '_attributes': { version: '1.0' },
                            '_text': 0
                        },
                        valueParameter: 'n/a',
                        controlValue: 'n/a',
                        measuringUnit: 'n/a'
                    }]
                }
            },
            provisionalDiagnosis: diagnosis.mainDiagnosisCode,
            planSurvey: 'n/a',
            planTreatment: 'n/a'
        };
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
                CertifiedExtract: parseCertifiedExtract(thecase),
                Services: parseAllServices(thecase),
                PrimaryExamination: parseExamination(thecase, first)
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
         * Возвращает все случаи пациента.
         * @param {String} d параметры
         * @return {Promise<Object>}
         */
        getCase: d =>
            getCase(d)
                .catch(e => console.error(e)),

        /**
         * Возвращает формы для ИЭМК
         * @param {String} patientUid UID пациента
         * @param {Date} [lastDate] дата последней выгрузки
         * @return {Promise<Object>}
         */
        getForms: (patientUid, lastDate) =>
            getForms(patientUid, lastDate)
                .catch(e => console.error(e)),

        clearCache
    };
};

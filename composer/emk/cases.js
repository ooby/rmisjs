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
    for (let i of path.split('.')) {
        if (i in data === false) return def;
        data = data[i];
    }
    return [].concat(data).shift() || def;
};

const $$ = (data, path, def) => {
    if (!data) return def;
    if (!path) return data || def;
    for (let i of path.split('.')) {
        if (i in data == false) return def;
        data = data[i];
    }
    data = [].concat(data);
    return !data.length ? null : data;
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
     * @param {String} patientUid
     * @return {Promise<Object>}
     */
    const getCase = async patientUid => {
        let data = await c.searchCaseAsync({
            patientUid
        });
        return $$(data, 'cases.caseComplex', null);
    };

    /**
     * Возвращает код должности врача по названию должности
     * @param {String} positionName
     * @return {Promise<String>}
     */
    const parseDoctorPost = async positionName => {
        if (!positionName) return null;
        let code = await rb.getCodeNSI(positionName, keys['MDP365']);
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
        speciality = $(speciality, 'position.speciality');
        if (!speciality) return null;
        let specName = await rb.getValueRMIS('pim_speciality', 'ID', speciality, 'NAME');
        if (!specName) return null;
        let specCode = await rb.getCodeNSI(specName, keys['C33001']);
        return specCode || null;
    };

    const parseSnils = async uid => {
        let doc = $(await docParser.searchSnils(uid), 'number', null);
        if (!doc) return null;
        if (/^\d{3}-\d{3}-\d{3}\s\d{2}$/.test(doc)) return doc;
        if (/^\d{11}$/.test(doc)) {
            return [
                [doc.slice(0, 3), doc.slice(3, 6), doc.slice(6, 9)].join('-'),
                doc.slice(9, 11)
            ].join(' ');
        }
        return null;
    };

    /**
     * Возвращает сведения о враче
     * @param {Object} thecase - случай пациента
     * @param {Object} visit - посещение пацинта
     * @return {Promise<Object>}
     */
    const parseDoctor = async(thecase, visit) => {
        if (!thecase || !visit) return null;
        let docUid = $(visit, 'Doctor.Patient.patientUid', null);
        if (!docUid) return null;
        if (doctors.has(docUid)) return doctors.get(docUid);
        let doctor = await waitForNull({
            uid: docUid,
            snils: parseSnils(docUid),
            postCode: parseDoctorPost($(visit, 'Doctor.positionName')),
            specialtyCode: parseDoctorSpec($(visit, 'Doctor.positionId'))
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

    const parsePaymentData = async thecase => {
        if (!thecase) return null;
        let paymentData = await waitForNull({
            typePaymentCode: $(thecase, 'fundingSourceTypeId'),
            policyNumber: match(/^\d{16}$/, $(thecase, 'Patient.polis')),
            insuranceCompanyCode: $(thecase, 'document.issuerCode')
        });
        let funding = parseInt($(thecase, 'fundingSourceTypeId'));
        if (!funding) return null;
        if (funding === 2) return null;
        if (funding === 5) paymentData.typePaymentCode = '2';
        if ('policyNumber' in paymentData) delete paymentData.policyNumber;
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
        let doctor = await parseDoctor(thecase, visit);
        if (!doctor) return null;
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
        if (!resultId) return null;
        return rb.getValueRMIS('mc_step_result', 'ID', resultId, 'CODE');
    };

    const parseDiseaseResult = deseaseResultId => {
        if (!deseaseResultId) return null;
        return rb.getValueRMIS('mc_step_care_result', 'ID', deseaseResultId, 'CODE');
    };

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
            root: 'Form025',
            form: Object.assign(data, diagnosis)
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
            root: 'AmbulatorySummary',
            form: Object.assign(data, diagnosis)
        };
    };

    const parsePatientDocument = async uid => {
        if (!uid) return null;
        let doc = await docParser.searchPolis(uid);
        if (!doc) return null;
        doc.issuerCode = await rb.getValueRMIS('pim_organization', 'ID', doc.issuer, 'CODE');
        return doc;
    };

    const parseForm = async careProvidingFormId => {
        if (!careProvidingFormId) return null;
        let name = await rb.getValueRMIS('md_care_providing_form', 'ID', careProvidingFormId, 'NAME');
        if (!name) return;
        return await rb.getCodeNSI(name, keys['PRK470']);
    };

    const parseCare = careLevelId =>
        rb.getValueRMIS('mc_care_level', 'ID', careLevelId, 'CODE');

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
        if (!record.renderedServices) return null;
        let services = [].concat(record.renderedService);
        if (services.length === 0) return null;
        let result = {};
        await Promise.all(
            services.map(async i => {
                if (!i) return null;
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

    const getForms = async d => {
        let cases = await getCase(d);
        if (!cases) return null;
        let result = [];
        await Promise.all(
            cases.map(async thecase => {
                if (!thecase) return null;
                let hsp = !!thecase.hspRecords;
                let amb = !thecase.hspRecords && thecase.Visits;
                if (hsp === amb) return null;
                if (hsp) {
                    thecase.hspRecords = $$(thecase, 'hspRecords.hospitalRecord', null);
                    if (!thecase.hspRecords) return null;
                } else {
                    thecase.Visits = $$(thecase, 'Visits.Visit', null);
                    if (!thecase.Visits) return null;
                }
                let data = {
                    document: parsePatientDocument($(thecase, 'Patient.patientUid')),
                    careProvidingFormCode: parseForm($(thecase, 'careProvidingFormId'))
                };
                if (amb) {
                    Object.assign(data, {
                        careLevelCode: parseCare($(thecase, 'careLevelId'))
                    });
                }
                data = await waitForNull(data);
                if (!data) return null;
                if (amb) thecase.Patient.polis = $(data, 'document.number');
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
                let meta = {
                    caseId: thecase.id,
                    patientId: d,
                    date: thecase.createdDate
                };
                if (closed) {
                    let data;
                    if (hsp) data = await parseStationarySummary(thecase);
                    else data = await parseSummaryVisits(thecase, thecase.Visits[0]);
                    if (data === null) return;
                    result.push(Object.assign(data, meta));
                } else {
                    let iterator = hsp ? parseHspRecord : parse025Visit;
                    let arr = hsp ? thecase.hspRecords : thecase.Visits;
                    await Promise.all(
                        arr.map(async i => {
                            let res = await iterator(thecase, i);
                            if (res === null) return;
                            result = result.concat(Object.assign(res, meta));
                        })
                    );
                }
            })
        );
        return result;
    };

    return {
        /**
         * Возвращает все случаи пациента по его UID.
         * @param {String} patientUid - UID пациента
         * @return {Promise<Object>}
         */
        getCase: patientUid =>
            getCase(patientUid)
            .catch(console.error),

        /**
         * Возвращает формы для ИЭМК
         * @param {String} patientUid - UID пациента
         * @return {Promise<Object>}
         */
        getForms: patientUid =>
            getForms(patientUid)
            .catch(console.error),

        clearCache
    };
};

const soap = require('soap');
const refbooks = require('refbooks');
const moment = require('moment');
const url = require('url');
const {
    getRefbook
} = require('./collect');

const wsdl = '/carbondss/services/MedbaseCases/MedbaseCases.SecureSOAP11Endpoint.xml';
const endpoint = '/carbondss/services/MedbaseCases.SOAP11Endpoint/';

const createClient = async(cfg) => {
    let client = await soap.createClientAsync(url.resolve(cfg.rmis.path, wsdl), {
        endpoint: url.resolve(cfg.rmis.path, endpoint)
    });
    client.setSecurity(new soap.BasicAuthSecurity(cfg.rmis.auth.username, cfg.rmis.auth.password));
    return client;
};

const composeMethod = (c, method) =>
    async (...opts) => {
        try {
            return await method(c, ...opts);
        } catch (e) {
            console.error(e);
            return e;
        }
    };

const wind = d => [].concat(d);
const unwind = d => wind(d).pop();

/**
 * Сведения о случае по UID пациента
 * @param {Client} c - Клиент SOAP
 * @param {String} d - UID пациента
 * @return {Promise<Object>}
 */
const getCaseByIndividual = (c, d) =>
    c.searchCaseAsync({
        patientUid: d
    });

const parseAdmissionDate = (date, time) =>
    moment(unwind(date).split('+').shift() + 'T' + unwind(time)).toDate();

const parseVisits = d => {
    d = unwind(
        wind(d.Visit).sort((a, b) => {
            a = a.dateTime = parseAdmissionDate(a.admissionDate, a.admissionTime);
            b = b.dateTime = parseAdmissionDate(b.admissionDate, b.admissionTime);
            return b - a;
        })
    );
    d.dateTime = moment(d.dateTime).utc().format('GGGG-MM-DDTHH:mm:ss[Z]');
    return d;
};

const parseCase = d => {
    let visit = parseVisits(d.Visits);
    return {
        visit: {
            dateTime: visit.dateTime,
            placeServicesCode: visit.placeId,
            purposeVisitCode: d.initGoalId,
            typeTreatmentCode: 1
            // typeAssistanceCode:
        }
    };
};

/**
 * Форма 025-12/у по UID пациента
 * @param {Client} c - Клиент SOAP
 * @param {String} d - UID пациента
 * @return {Promise<Object>}
 */
const get025ByIndividual = async (c, d) => {
    let data = await getCaseByIndividual(c, d);
    return (
        wind(data.cases.caseComplex)
        .reduce((p, item) =>
            p.concat(parseCase(item))
        , [])
    );
};

const methods = {
    getCaseByIndividual,
    get025ByIndividual
};

module.exports = async (s) => {
    let c = await createClient(s);
    for (let method of Object.keys(methods)) {
        methods[method] = composeMethod(c, methods[method]);
    }
    return methods;
};

const j2x = require('js2xmlparser');
const cases = require('../libs/cases');
const collect = require('./collect');

const excludeDoctorUid = data => {
    if (!data.Services) return null;
    if (!data.Services.Service) return null;
    for (let service of [].concat(data.Services.Service)) {
        if (!service) continue;
        if (!service.doctor) continue;
        if (!service.doctor.uid) continue;
        delete service.doctor.uid;
    }
    return data;
};

const exclude = data => {
    data = excludeDoctorUid(data) || data;
    return data;
};

const convertToXml = data => {
    let root = Object.keys(data)[0];
    data = data[root];
    data = exclude(data) || data;
    return j2x.parse(root, data, {
        format: {
            indent: '',
            newline: '',
            pretty: false
        }
    });
};

module.exports = async s => {
    let collector = await collect(s);

    return {
        syncForms: async uid => {
            let forms = await cases.getForms(s, uid);
            let [doctors, patient] = await Promise.all([
                collector.getDoctors(forms),
                collector.getPatient(forms)
            ]);
            return {
                forms,
                doctors,
                patient
            };
        }
    };
};

const j2x = require('js2xmlparser');
const cases = require('./cases');
const collect = require('./collect');

const exclude = data => {
    if (!data) return null;
    if (!data.form) return null;
    if (!data.form.Services) return null;
    data = [].concat(data.form.Services.Service);
    if (!data.length) return null;
    for (let service of data) {
        if (!service) continue;
        if (!service.doctor) continue;
        delete service.doctor.uid;
    }
    return data;
};

const convertToXml = data =>
    j2x.parse(data.root, exclude(data).form, {
        format: {
            indent: '',
            newline: '',
            pretty: false
        }
    });

module.exports = async s => {
    let collector = await collect(s);
    let cased = await cases(s);
    return {
        getForms: async uid => {
            let patient = await collector.getPatient(uid);
            if (!patient) return null;
            let forms = await cased.getForms(uid);
            if (!forms) return null;
            forms = [].concat(forms);
            if (!forms.length) return null;
            let doctors = await collector.getDoctors(forms);
            if (!doctors) return null;
            doctors = [].concat(doctors);
            if (!doctors.length) return null;
            collector.clearCache();
            return forms.map(i =>
                Object.assign(i, {
                    doctors,
                    patient
                })
            );
        },
        convertToXml,
        clearCache: () => cased.clearCache()
    };
};

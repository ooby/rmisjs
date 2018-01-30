const j2x = require('js2xmlparser');
const cases = require('./cases');
const collect = require('./collect');

const exclude = form => {
    if (!form) return null;
    if (!form.Services) return null;
    for (let service of [].concat(form.Services.Service)) {
        if (!service) continue;
        if (!service.doctor) continue;
        delete service.doctor.uid;
    }
    return form;
};

const convertToXml = data =>
    j2x.parse(data.root, exclude(data.form), {
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
        getForms: async (uid, lastDate) => {
            let patient = await collector.getPatient(uid);
            if (!patient) {
                console.log(new Date().toString(), uid, 'missing patient data');
                return null;
            }
            let forms = await cased.getForms(uid, lastDate);
            forms = [].concat(forms);
            if (!forms.length || (forms.length === 1 && !forms[0])) {
                console.log(new Date().toString(), uid, 'missing form data');
                return null;
            }
            let doctors = await collector.getDoctors(forms);
            if (!doctors) {
                console.log(new Date().toString(), uid, 'missing doctor data');
                return null;
            }
            doctors = [].concat(doctors);
            if (!doctors.length) {
                console.log(new Date().toString(), uid, 'missing doctor data');
                return null;
            }
            return forms.map(i =>
                Object.assign(i, {
                    doctors,
                    patient
                })
            );
        },
        convertToXml,
        clearCache: Object.assign(cased.clearCache, collector.clearCache)
    };
};

const xmljs = require('xml-js');
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
    xmljs.js2xml(
        {
            _declaration: {
                _attributes: {
                    version: '1.0',
                    encoding: 'utf-8'
                }
            },
            [data.root]: Object.assign(
                {
                    _attributes: {
                        'xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',
                        'xmlns:xsi':
                            'http://www.w3.org/2001/XMLSchema-instance',
                        'xmlns:tns': 'http://hostco.ru/iemk'
                    }
                },
                exclude(data.form)
            )
        },
        {
            compact: true,
            elementNameFn: val => `tns:${val}`
        }
    );

const missing = (uid, part) => {
    console.log(new Date().toString(), uid, `missing ${part}`);
    return null;
};

const forArray = async cb => {
    let data = [].concat(await cb()).filter(i => !!i);
    return data.length ? data : null;
};

module.exports = async s => {
    let collector = await collect(s);
    let cased = await cases(s);

    const getForms = async (uid, lastDate) => {
        let patient = await collector.getPatient(uid);
        if (!patient) return missing(uid, 'patient data');
        let forms = await forArray(() => cased.getForms(uid, lastDate));
        if (!forms) return missing(uid, 'form data');
        let doctors = await forArray(() => collector.getDoctors(forms));
        if (!doctors) return missing(uid, 'doctor data');
        return forms.map(i =>
            Object.assign(i, {
                doctors,
                patient
            })
        );
    };

    return {
        getForms,
        convertToXml,
        clearCache: Object.assign(cased.clearCache, collector.clearCache)
    };
};

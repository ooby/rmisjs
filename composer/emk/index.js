const rmisjs = require('../../index');
const moment = require('moment');
const emd = require('./emd');

const uuid = require('../mongo/uuid');
const connect = require('../mongo/connect');
const Document = require('../mongo/model/document');

const _types = {
    AmbulatorySummary: uuid.setUUID('3F95F4C5-CA9C-4F4F-A744-4C21F56E4166'),
    StationarySummary: uuid.setUUID('67ABC9CE-7603-4CD9-A049-16727D0E6CCC'),
    Form025: uuid.setUUID('3F95F4C5-CA9C-4F4F-A744-4C21F56E416C'),
    Form066: uuid.setUUID('EFDE8450-7E37-4FF7-B084-E642E7EEAA4F')
};

const dateFromObjectId = id => new Date(Buffer.from(id, 'hex').readInt32BE() * 1000);

module.exports = async s => {
    const synced = new Set([]);
    const rmis = rmisjs(s);
    const patient = await rmis.rmis.patient();
    const emk14 = rmis.integration.emk14;
    const prof = emk14.professional();
    const ptnt = emk14.patient();
    const docs = emk14.document();
    const {
        getForms,
        convertToXml,
        clearCache
    } = await emd(s);

    const syncIndividual = async(service, data) => {
        if (Object.values(data).indexOf(null) > -1) return false;
        if (synced.has(data.snils)) return true;
        try {
            await service.search(data.snils);
            synced.add(data.snils);
            return true;
        } catch (e) {
            if (!e.ErrorCode) throw e;
            if (parseInt(e.ErrorCode) !== -2) throw e;
            await service.publish(data);
            synced.add(data.snils);
            return true;
        }
    };

    const findDocument = async data => {
        let id = await Document.findOne(data, {
            _id: true
        }).lean();
        if (!id) {
            id = new Document(data);
            await id.save();
        }
        return id._id.toString();
    };

    const syncForm = async form => {
        if (!form.patient || !form.form) return null;
        form.doctors = [].concat(form.doctors);
        if (!form.doctors.length) return null;
        form.doctors = form.doctors.filter(doctor => Object.values(doctor).indexOf(null) === -1);
        if (!form.doctors.length) return null;
        let doctor;
        for (let service of [].concat(form.form.Services.Service)) {
            if (!service) continue;
            if (!service.doctor) continue;
            if (!service.doctor.snils ||
                !service.doctor.postCode ||
                !service.doctor.specialtyCode) continue;
            service.doctor.snils.replace(/[\s-]/g, '');
            let codes = form.doctors.find(i => i.snils.replace(/[\s-]/g, '') === service.doctor.snils);
            if (!codes) continue;
            doctor = service.doctor;
            Object.assign(doctor, codes);
            break;
        }
        if (!doctor) return null;
        await Promise.all(
            form.doctors.map(doctor => syncIndividual(prof, doctor))
            .concat(syncIndividual(ptnt, form.patient))
        );
        let data = {
            Type: _types[form.root],
            caseId: form.caseId,
            PatientSnils: form.patient.snils,
            ProfessionalSnils: doctor.snils,
            CardNumber: form.patientId,
            CaseBegin: moment(form.date, 'YYYY-MM-DDZ').toDate()
        };
        let id = await connect(s, () => findDocument(data));
        let date = dateFromObjectId(id);
        let existing;
        try {
            existing = await docs.search({
                DocumentMcod: s.er14.muCode,
                PatientSnils: data.PatientSnils
            });
        } catch (e) {
            if (!e.ErrorCode) throw e;
            if (parseInt(e.ErrorCode) !== -3) throw e;
        }
        Object.assign(data, {
            mcod: s.er14.muCode.toString(),
            date: moment(date).format('YYYY-MM-DD[T]HH:mm:ss'),
            CaseBegin: moment(data.CaseBegin).format('YYYY-MM-DD'),
            documentId: id,
            Type: {
                '@version': '1.0',
                '$': uuid.getUUID(data.Type.buffer)
            },
            ProfessionalRole: {
                '@version': '1.0',
                '$': 'DOC'
            },
            Confdentiality: {
                '@version': '1.0',
                '$': 'V'
            },
            PatientConfidentiality: {
                '@version': '1.0',
                '$': 'R'
            },
            AssigneeConfidentiality: {
                '@version': '1.0',
                '$': 'R'
            },
            ProfessionalPost: {
                '@version': '1.0',
                '$': doctor.postCode
            },
            ProfessionalSpec: {
                '@version': '1.0',
                '$': doctor.specialtyCode
            },
            StructuredBody: Buffer.from(convertToXml(form)).toString('base64')
        });
        existing = [].concat(existing.DocumentList).find(i => i.documentId === data.documentId);
        if (existing) {
            data.id = existing.id;
        }
        await docs.publish(data);
    };

    const syncPatient = async patient => {
        if (!patient) return;
        let forms = await getForms(patient);
        if (!forms) return;
        forms = [].concat(forms);
        if (!forms.length) return;
        await Promise.all(
            forms.map(form => syncForm(form))
        );
    };

    const syncPatients = async (...patients) => {
        if (!patients.length) return;
        if (!patients[0]) return;
        await Promise.all(
            patients.map(patient => {
                if (!patient) return;
                return syncPatient(patient);
            })
        );
    };

    return {
        async syncAll() {
            let page = 1;
            while (true) {
                let data = await patient.searchPatient({
                    page,
                    regClinicId: s.rmis.clinicId
                });
                if (!data) break;
                if (!data.patient) break;
                data = [].concat(data.patient);
                if (!data.length) break;
                if (!data[0]) break;
                page++;
                await syncPatients(...[].concat(data));
                break;
            };
            clearCache();
            synced.clear();
        },
        syncPatient,
        syncPatients,
        syncForm
    };
};

const moment = require('moment')

const emd = require('./emd')
const rmisjs = require('../../index')

const Document = require('../mongo/model/document')
const LastSync = require('../mongo/model/lastSync')

const _types = {
  AmbulatorySummary: '3F95F4C5-CA9C-4F4F-A744-4C21F56E4166',
  StationarySummary: '67ABC9CE-7603-4CD9-A049-16727D0E6CCC',
  Form025: '3F95F4C5-CA9C-4F4F-A744-4C21F56E416C',
  Form066: 'EFDE8450-7E37-4FF7-B084-E642E7EEAA4F'
}

const dateFromObjectId = id =>
  new Date(Buffer.from(id, 'hex').readInt32BE() * 1000)

module.exports = async s => {
  const synced = new Set([])
  const { rmis, integration } = rmisjs(s)
  const { emk14 } = integration
  const [patient, prof, ptnt, docs, emds] = await Promise.all([
    rmis.patient(),
    emk14.professional(),
    emk14.patient(),
    emk14.document(),
    emd(s)
  ])

  const syncIndividual = async (service, data) => {
    if (!data) return null
    if (Object.values(data).indexOf(null) > -1) return false
    if (synced.has(data.snils)) return true
    try {
      await service.search(data.snils)
      synced.add(data.snils)
      return true
    } catch (e) {
      if (!e.code) throw e
      if (parseInt(e.code) !== -3) throw e
      await service.publish(data)
      synced.add(data.snils)
      return true
    }
  }

  const findDocument = async data => {
    let doc = await Document.findOne(data).exec()
    if (!doc) {
      doc = new Document(data)
      await doc.save()
    }
    return doc._id.toString()
  }

  const syncForm = async form => {
    let error = null
    let id
    try {
      if (!form) return
      if (Object.values(form).indexOf(null) > -1) return
      let doctor = form.doctors.find(i => !!i.specialityCode && !!i.postCode)
      if (!doctor) return null
      let { specialityCode, postCode } = doctor
      await Promise.all(
        form.doctors
          .map(doctor => {
            delete doctor.postCode
            delete doctor.specialityCode
            return syncIndividual(prof, doctor)
          })
          .concat(syncIndividual(ptnt, form.patient))
      )
      let data = {
        Type: _types[form.root],
        caseId: form.caseId,
        PatientSnils: form.patient.snils.replace(/[-\s]/g, ''),
        ProfessionalSnils: doctor.snils.replace(/[-\s]/g, ''),
        CardNumber: form.patientId,
        CaseBegin: form.date,
        CaseEnd: form.end
      }
      id = await findDocument(data)
      let existing = null
      try {
        existing = await docs.search({
          DocumentMcod: s.er14.muCode,
          PatientSnils: data.PatientSnils
        })
      } catch (e) {
        if (!e) throw e
        if (e.code !== -3) throw e
      }
      delete data.caseId
      Object.assign(data, {
        mcod: s.er14.muCode.toString(),
        Date: moment(dateFromObjectId(id)).format('YYYY-MM-DD[T]HH:mm:ss'),
        CaseBegin: moment(data.CaseBegin).format('YYYY-MM-DD'),
        CaseEnd: moment(data.CaseEnd).format('YYYY-MM-DD'),
        DocumentId: id,
        Type: {
          $: data.Type,
          '@version': '1.0'
        },
        ProfessionalRole: {
          $: 'DOC',
          '@version': '1.0'
        },
        Confidentiality: {
          $: 'V',
          '@version': '1.0'
        },
        PatientConfidentiality: {
          $: 'R',
          '@version': '1.0'
        },
        AssigneeConfidentiality: {
          $: 'R',
          '@version': '1.0'
        },
        ProfessionalPost: {
          $: postCode['_text'],
          '@version': '1.0'
        },
        ProfessionalSpec: {
          $: specialityCode['_text'],
          '@version': '1.0'
        },
        StructuredBody: Buffer.from(emds.convertToXml(form)).toString('base64')
      })
      if (existing) {
        existing = []
          .concat(existing.DocumentList)
          .find(
            i =>
              i.documentId === data.documentId &&
              i.Type['$'].toUpperCase() === data.Type['$'].toUpperCase()
          )
        if (existing) data.Id = existing.Id
      }
      await docs.publish(data)
    } catch (e) {
      error = e
      console.error(e)
    } finally {
      await Document.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            UploadDate: new Date(),
            ErrorText: JSON.stringify(error)
          }
        }
      )
    }
  }

  const syncPatient = async (patient, lastDate) => {
    try {
      if (!patient) return
      console.log(new Date().toString(), patient, 'start')
      let forms = await emds.getForms(patient, lastDate)
      if (!forms) return
      await Promise.all(
        [].concat(forms).map(form => syncForm(form).catch(console.error))
      )
      console.log(new Date().toString(), patient, 'finished')
    } finally {
      emds.clearCache.collect()
      emds.clearCache.docParser()
      emds.clearCache.doctors()
    }
  }

  const syncPatients = async (patients, lastDate) => {
    for (let patient of [].concat(patients)) {
      try {
        await syncPatient(patient, lastDate)
      } catch (e) {
        console.error(e)
      }
    }
  }

  const getLastDate = async () => {
    let data = await LastSync.find({})
      .sort({ date: -1 })
      .limit(1)
      .exec()
    return data ? data.date : null
  }

  const setLastDate = async date => {
    let doc = new LastSync({ date })
    await LastSync.remove({})
    await doc.save()
  }

  return {
    async syncAll() {
      try {
        let now = new Date()
        let lastDate = await getLastDate()
        let page = 1
        let last = Promise.resolve()
        for (;;) {
          let data = await patient.searchPatient({
            page,
            regClinicId: s.rmis.clinicId
          })
          if (!data) break
          if (!data.patient) break
          data = [].concat(data.patient)
          if (!data.length) break
          if (!data[0]) break
          page++
          await last
          last = syncPatients(data, lastDate)
        }
        await last
        await setLastDate(now)
      } catch (e) {
        console.error(e)
        return e
      } finally {
        synced.clear()
        emds.clearCache.refbooks()
      }
    },
    async syncPatient(patient) {
      try {
        let now = new Date()
        let lastDate = await getLastDate()
        await syncPatient(patient, lastDate)
        await setLastDate(now)
      } catch (e) {
        console.error(e)
        return e
      } finally {
        synced.clear()
        emds.clearCache.refbooks()
      }
    }
  }
}

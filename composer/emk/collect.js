const rmisjs = require('../../index')
const document = require('../libs/document')

module.exports = async s => {
  const cache = new Map()
  const [ind, doc] = await Promise.all([
    rmisjs(s).rmis.individual(),
    document(s)
  ])

  const parseIndividual = async (uid, snils) => {
    if (cache.has(uid)) return cache.get(uid)
    let indiv = await ind.getIndividual(uid)
    if (!snils) {
      snils = await doc.searchSnils(uid)
      if (!snils) return null
      if (!snils.number) return null
      snils = snils.number
    }
    let data = {
      mcod: s.er14.muCode,
      snils: snils.replace(/[-\s]/g, ''),
      LastName: indiv.surname,
      FirstName: indiv.name,
      MiddleName: indiv.patrName,
      BirthDate: indiv.birthDate ? indiv.birthDate.replace(/\+.*$/g, '') : null,
      Sex: {
        '@version': '1.0',
        $: indiv.gender
      }
    }
    cache.set(uid, data)
    return data
  }

  return {
    clearCache: {
      collect: () => cache.clear(),
      docParser: () => doc.clearCache()
    },
    getPatient: uid => parseIndividual(uid),
    getDoctors: async forms => {
      let uids = new Set([])
      let doctors = []
      await Promise.all(
        forms.map(async i => {
          if (!i) return null
          if (Object.values(i).indexOf(null) > -1) return null
          let services = i.form.Services
          if (!services) return null
          services = [].concat(services.Service)
          await Promise.all(
            services.map(async service => {
              if (!service) return
              let { doctor } = service
              let { uid, snils, postCode, specialtyCode } = doctor
              if (uids.has(uid)) return
              uids.add(uid)
              let parsed = await parseIndividual(uid, snils)
              if (!parsed) return
              doctors.push(
                Object.assign(parsed, {
                  postCode,
                  specialityCode: specialtyCode
                })
              )
            })
          )
        })
      )
      uids.clear()
      return doctors
    }
  }
}

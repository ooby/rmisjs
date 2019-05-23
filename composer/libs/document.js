const rmisjs = require('../../index')

module.exports = async s => {
  const cache = new Map()

  const individual = await rmisjs(s).rmis.individual()

  const searchDocuments = async (uid, type, pattern, caching = true) => {
    uid = [].concat(uid).pop()
    if (!uid) return null
    let key = `${uid}-${type}`
    if (cache.has(key) && caching) return cache.get(uid)
    let docs = await individual.getIndividualDocuments(uid)
    if (!docs) return null
    if (!docs.document) return null
    docs = [].concat(docs.document)
    if (docs.length === 0) return null
    for (let doc of docs) {
      doc = await individual.getDocument(doc)
      if (!doc) continue
      if (
        doc.type !== type ||
        !pattern.test(doc.number) ||
        doc.active !== 'true'
      )
        continue
      if (caching) cache.set(uid, doc)
      return doc
    }
    return null
  }

  const getBirthDate = async uid => {
    let data = await individual.getIndividual(uid)
    if (!data) return null
    if (!data.birthDate) return null
    return data.birthDate.replace(/\+.*/g, '')
  }

  return {
    /**
     * Поиск СНИЛС по UID владельца.
     * Если документ найден, возвращает данные документа, иначе - null.
     * @param {String} uid
     * @param {Boolean} caching Определяет, должны ли кэшироваться данные документа.
     * @return {Promise<Object | null>}
     */
    searchSnils: (uid, caching) =>
      searchDocuments(
        uid,
        '19',
        /^(\d{11}|\d{3}-\d{3}-\d{3}\s\d{2})$/,
        caching
      ).catch(console.error),

    /**
     * Поиск полиса ОМС по UID владельца.
     * Если документ найден, возвращает данные документа, иначе - null.
     * @param {String} uid
     * @param {Boolean} caching Определяет, должны ли кэшироваться данные документа.
     * @return {Promise<Object>}
     */
    searchPolis: (uid, caching) =>
      searchDocuments(uid, '26', /^\d{16}$/, caching).catch(console.error),

    /**
     * Поиск документа по типу и UID владельца.
     * Если документ найден, возвращает данные документа, иначе - null.
     * @param {String} uid UID владельца документа
     * @param {String | Number} type Код типа документа
     * @param {Boolean} caching Определяет, должны ли кэшироваться данные документа.
     * @return {Promise<Object>}
     */
    searchDocument: (uid, type, caching) =>
      searchDocuments(uid, type, /.*/, caching).catch(console.error),

    /**
     * Возвращает дату рождения по UID пациента.
     * @param {String} uid
     * @return {Promise<String>}
     */
    getBirthDate: uid => getBirthDate(uid).catch(console.error),

    /**
     * Принудительно очистить кэш документов
     * @return {void}
     */
    clearCache: () => cache.clear()
  }
}

const request = require('request')
const { JSDOM } = require('jsdom')
const Queue = require('../../libs/queue')

const _host =
  'https://14.is-mis.ru/medservices-ws/service-rs/renderedServiceProtocols/'
const q = new Queue(1)

const getAndParse = (s, i) =>
  new Promise((resolve, reject) =>
    request.get(
      _host + i,
      {
        auth: {
          user: s.rmis.auth.username,
          pass: s.rmis.auth.password
        }
      },
      (err, res, body) => {
        if (err) return reject(err)
        try {
          let dom = new JSDOM(body)
          resolve(dom.window.document)
        } catch (e) {
          reject(e)
        }
      }
    )
  )

const mapData = (schema, data) => {
  let entries = Object.entries(schema)
  let result = Array.from(data.querySelectorAll('items')).reduce((r, i) => {
    if (!i.children) return r
    let children = [].concat(i.children)
    if (!children.length) return r
    let [name, value] = children
    if (!name || !value) return r
    name = name.textContent
    value = value.textContent
    for (let [k, v] of entries) {
      if (name === v) {
        r[k] = value
        return r
      }
    }
    return r
  }, {})
  return result
}

module.exports = async (s, renderedServiceId) => {
  let data = await q.push(() => getAndParse(s, renderedServiceId))
  if (!data) return null
  data = mapData(
    {
      complaints: '_Жалобы больного',
      historyDisease: '_Анамнез заболевания'
    },
    data
  )
  if ('historyDisease' in data) {
    data.anamnesisDisease = {
      historyDisease: data.historyDisease
    }
    delete data.historyDisease
  }
  return data
}

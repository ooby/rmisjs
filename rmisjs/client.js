const soap = require('soap')
const { url } = require('../libs/url')

module.exports = async (cfg, opt) => {
  cfg = cfg.rmis
  let c = await soap.createClientAsync(url(cfg, opt)[0])
  c.setSecurity(
    new soap.BasicAuthSecurity(cfg.auth.username, cfg.auth.password)
  )
  return c
}

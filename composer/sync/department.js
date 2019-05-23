const deptFormat = require('./format').deptFormat
const rmisjs = require('../../index')

exports.syncDepartments = async (s, d) => {
  try {
    const er14 = await rmisjs(s).integration.er14.process()
    let r = await er14.getMuInfo({
      'pt:muCode': s.er14.muCode
    })
    let result = []
    for (let i of r.muInfo.department) {
      if (!!i.deleted) continue
      i.deleted = true
      let log = await er14.updateMuInfo({
        'pt:muCode': s.er14.muCode,
        'pt:department': deptFormat(i)
      })
      if (parseInt(log.ErrorCode) !== 0) result.push(log)
    }
    for (let i of d) {
      let log = await er14.updateMuInfo({
        'pt:muCode': s.er14.muCode,
        'pt:department': deptFormat({
          deptCode: i.department.code,
          deptName: i.department.name,
          deptType: i.department.type,
          deleted: false
        })
      })
      if (parseInt(log.ErrorCode) !== 0) result.push(log)
    }
    return result
  } catch (e) {
    console.log(e)
    return e
  }
}

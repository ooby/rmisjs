const moment = require('moment')

/**
 * Формирует и возвращает список дат на n дней вперед
 * в формате YYYY-MM-DD
 * @param {number} n - количество дней
 * @return {array}
 */
exports.createDates = n => {
  let dates = []
  for (let i = 0; i < n; i++) {
    let d = moment().add(i, 'd')
    if (d.isoWeekday() !== 6 && d.isoWeekday() !== 7) {
      dates.push(d.format('YYYY-MM-DD'))
    }
  }
  return dates
}

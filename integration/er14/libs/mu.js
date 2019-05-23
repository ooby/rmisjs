const createClient = require('../client')
const Queue = require('../../../libs/queue')
const wrap = require('../../../libs/wrap')
const _ = require('lodash')

let q = null

module.exports = async s => {
  if (!q) q = new Queue(_.get(s, 'er14.limit', 50))
  let c = await q.push(() => createClient(s))
  return {
    describe: () => c.describe(),
    getMuInfo: d => wrap(q, () => c.getMuInfoAsync(d)),
    updateMuInfo: d => wrap(q, () => c.updateMuInfoAsync(d)),
    updateCabinetInfo: d => wrap(q, () => c.updateCabinetInfoAsync(d)),
    updateStaffInfo: d => wrap(q, () => c.updateStaffInfoAsync(d)),
    updateSchedule: d => wrap(q, () => c.updateScheduleAsync(d)),
    changeSlotState: d => wrap(q, () => c.changeSlotStateAsync(d)),
    changeCabinet: d => wrap(q, () => c.changeCabinetAsync(d)),
    deleteSchedule: d => wrap(q, () => c.deleteScheduleAsync(d)),
    updateSickLeaves: d => wrap(q, () => c.updateSickLeavesAsync(d)),
    updateDistrict: d => wrap(q, () => c.updateDistrictAsync(d)),
    getScheduleInfo: d => wrap(q, () => c.getScheduleInfoAsync(d)),
    getAppointmentsBySNILS: d =>
      wrap(q, () => c.getAppointmentsBySNILSAsync(d)),
    readSlotState: d => wrap(q, () => c.readSlotStateAsync(d)),
    deleteSlot: d => wrap(q, () => c.deleteSlotAsync(d)),
    findDistrict: d => wrap(q, () => c.findDistrictAsync(d)),
    getActualSpecialistList: d =>
      wrap(q, () => c.getActualSpecialistListAsync(d)),
    getSlotListByPeriod: d => wrap(q, () => c.getSlotListByPeriodAsync(d))
  }
}

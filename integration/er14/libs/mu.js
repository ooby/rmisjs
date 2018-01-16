const createClient = require('../client');
const Queue = require('../../../libs/queue');

const q = new Queue(1);

module.exports = async s => {
    let c = await createClient(s);
    return {
        describe: () =>
            c.describe(),
        getMuInfo: d =>
            q.push(() => c.getMuInfoAsync(d)),
        updateMuInfo: d =>
            q.push(() => c.updateMuInfoAsync(d)),
        updateCabinetInfo: d =>
            q.push(() => c.updateCabinetInfoAsync(d)),
        updateStaffInfo: d =>
            q.push(() => c.updateStaffInfoAsync(d)),
        updateSchedule: d =>
            q.push(() => c.updateScheduleAsync(d)),
        changeSlotState: d =>
            q.push(() => c.changeSlotStateAsync(d)),
        changeCabinet: d =>
            q.push(() => c.changeCabinetAsync(d)),
        deleteSchedule: d =>
            q.push(() => c.deleteScheduleAsync(d)),
        updateSickLeaves: d =>
            q.push(() => c.updateSickLeavesAsync(d)),
        updateDistrict: d =>
            q.push(() => c.updateDistrictAsync(d)),
        getScheduleInfo: d =>
            q.push(() => c.getScheduleInfoAsync(d)),
        getAppointmentsBySNILS: d =>
            q.push(() => c.getAppointmentsBySNILSAsync(d)),
        readSlotState: d =>
            q.push(() => c.readSlotStateAsync(d)),
        deleteSlot: d =>
            q.push(() => c.deleteSlotAsync(d)),
        findDistrict: d =>
            q.push(() => c.findDistrictAsync(d)),
        getActualSpecialistList: d =>
            q.push(() => c.getActualSpecialistListAsync(d)),
        getSlotListByPeriod: d =>
            q.push(() => c.getSlotListByPeriodAsync(d))
    };
};

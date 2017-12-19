const createClient = require('../client');

module.exports = async s => {
    let c = await createClient(s);
    return {
        describe: d => c.describe(),
        getMuInfo: d => c.getMuInfoAsync(d),
        updateMuInfo: d => c.updateMuInfoAsync(d),
        updateCabinetInfo: d => c.updateCabinetInfoAsync(d),
        updateStaffInfo: d => c.updateStaffInfoAsync(d),
        updateSchedule: d => c.updateScheduleAsync(d),
        changeSlotState: d => c.changeSlotStateAsync(d),
        changeCabinet: d => c.changeCabinetAsync(d),
        deleteSchedule: d => c.deleteScheduleAsync(d),
        updateSickLeaves: d => c.updateSickLeavesAsync(d),
        updateDistrict: d => c.updateDistrictAsync(d),
        getScheduleInfo: d => c.getScheduleInfoAsync(d),
        getAppointmentsBySNILS: d => c.getAppointmentsBySNILSAsync(d),
        readSlotState: d => c.readSlotStateAsync(d),
        deleteSlot: d => c.deleteSlotAsync(d),
        findDistrict: d => c.findDistrictAsync(d),
        getActualSpecialistList: d => c.getActualSpecialistListAsync(d),
        getSlotListByPeriod: d => c.getSlotListByPeriodAsync(d)
    };
};

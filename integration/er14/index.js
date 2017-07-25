const {
    describe,
    getMuInfo,
    updateMuInfo,
    updateCabinetInfo,
    updateStaffInfo,
    updateSсhedule,
    changeSlotState,
    changeCabinet,
    deleteSchedule,
    updateSickLeaves,
    updateDistrict,
    getScheduleInfo,
    getAppointmentsBySNILS,
    readSlotState,
    deleteSlot,
    findDistrict,
    getActualSpecialistList,
    getSlotListByPeriod
} = require('./libs/mu');
const { createClient } = require('./client');
const composeLib = async (data, path, lib) => {
    try {
        let client = await createClient(path);
        return lib(data, client);
    } catch (e) { console.error(e); return e; }
};
module.exports = s => {
    let path = s.er14.path;
    return {
        describe: d => composeLib(d, path, describe),
        getMuInfo: d => composeLib(d, path, getMuInfo),
        updateMuInfo: d => composeLib(d, path, updateMuInfo),
        updateCabinetInfo: d => composeLib(d, path, updateCabinetInfo),
        updateStaffInfo: d => composeLib(d, path, updateStaffInfo),
        updateSсhedule: d => composeLib(d, path, updateSсhedule),
        changeSlotState: d => composeLib(d, path, changeSlotState),
        changeCabinet: d => composeLib(d, path, changeCabinet),
        deleteSchedule: d => composeLib(d, path, deleteSchedule),
        updateSickLeaves: d => composeLib(d, path, updateSickLeaves),
        updateDistrict: d => composeLib(d, path, updateDistrict),
        getScheduleInfo: d => composeLib(d, path, getScheduleInfo),
        getAppointmentsBySNILS: d => composeLib(d, path, getAppointmentsBySNILS),
        readSlotState: d => composeLib(d, path, readSlotState),
        deleteSlot: d => composeLib(d, path, deleteSlot),
        findDistrict: d => composeLib(d, path, findDistrict),
        getActualSpecialistList: d => composeLib(d, path, getActualSpecialistList),
        getSlotListByPeriod: d => composeLib(d, path, getSlotListByPeriod)
    };
}
exports.describe = (d, c) => new Promise((resolve, reject) => {
    if (d) { reject(d); }
    else {
        resolve(c.describe());
    }
});
exports.getMuInfo = (d, c) => new Promise((resolve, reject) => {
    c.getMuInfo(d, (e, r) => {
        if (e) { reject(e); }
        else { resolve(r); }
    });
});
exports.updateMuInfo = (d, c) => new Promise((resolve, reject) => {
    c.updateMuInfo(d, (e, r) => {
        if (e) { reject(e); }
        else { resolve(r); }
    });
});
exports.updateCabinetInfo = (d, c) => new Promise((resolve, reject) => {
    c.updateCabinetInfo(d, (e, r) => {
        if (e) { reject(e); }
        else { resolve(r); }
    });
});
exports.updateStaffInfo = (d, c) => new Promise((resolve, reject) => {
    c.updateStaffInfo(d, (e, r) => {
        if (e) { reject(e); }
        else { resolve(r); }
    });
});
exports.updateSchedule = (d, c) => new Promise((resolve, reject) => {
    c.updateSchedule(d, (e, r) => {
        if (e) { reject(e); }
        else { resolve(r); }
    });
});
exports.changeSlotState = (d, c) => new Promise((resolve, reject) => {
    c.changeSlotState(d, (e, r) => {
        if (e) { reject(e); }
        else { resolve(r); }
    });
});
exports.changeCabinet = (d, c) => new Promise((resolve, reject) => {
    c.changeCabinet(d, (e, r) => {
        if (e) { reject(e); }
        else { resolve(r); }
    });
});
exports.deleteSchedule = (d, c) => new Promise((resolve, reject) => {
    c.deleteSchedule(d, (e, r) => {
        if (e) { reject(e); }
        else { resolve(r); }
    });
});
exports.updateSickLeaves = (d, c) => new Promise((resolve, reject) => {
    c.updateSickLeaves(d, (e, r) => {
        if (e) { reject(e); }
        else { resolve(r); }
    });
});
exports.updateDistrict = (d, c) => new Promise((resolve, reject) => {
    c.updateDistrict(d, (e, r) => {
        if (e) { reject(e); }
        else { resolve(r); }
    });
});
exports.getScheduleInfo = (d, c) => new Promise((resolve, reject) => {
    c.getScheduleInfo(d, (e, r) => {
        if (e) { reject(e); }
        else { resolve(r); }
    });
});
exports.getAppointmentsBySNILS = (d, c) => new Promise((resolve, reject) => {
    c.getAppointmentsBySNILS(d, (e, r) => {
        if (e) { reject(e); }
        else { resolve(r); }
    });
});
exports.readSlotState = (d, c) => new Promise((resolve, reject) => {
    c.readSlotState(d, (e, r) => {
        if (e) { reject(e); }
        else { resolve(r); }
    });
});
exports.deleteSlot = (d, c) => new Promise((resolve, reject) => {
    c.deleteSlot(d, (e, r) => {
        if (e) { reject(e); }
        else { resolve(r); }
    });
});
exports.findDistrict = (d, c) => new Promise((resolve, reject) => {
    c.findDistrict(d, (e, r) => {
        if (e) { reject(e); }
        else { resolve(r); }
    });
});
exports.getActualSpecialistList = (d, c) => new Promise((resolve, reject) => {
    c.getActualSpecialistList(d, (e, r) => {
        if (e) { reject(e); }
        else { resolve(r); }
    });
});
exports.getSlotListByPeriod = (d, c) => new Promise((resolve, reject) => {
    c.getSlotListByPeriod(d, (e, r) => {
        if (e) { reject(e); }
        else { resolve(r); }
    });
});
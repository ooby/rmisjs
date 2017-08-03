module.exports = c => {
    return {
        describe: d => new Promise((resolve, reject) => {
            if (d) { reject(d); }
            else {
                resolve(c.describe());
            }
        }),
        getMuInfo: d => new Promise((resolve, reject) => {
            c.getMuInfo(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        updateMuInfo: d => new Promise((resolve, reject) => {
            c.updateMuInfo(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        updateCabinetInfo: d => new Promise((resolve, reject) => {
            c.updateCabinetInfo(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        updateStaffInfo: d => new Promise((resolve, reject) => {
            c.updateStaffInfo(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        updateSchedule: d => new Promise((resolve, reject) => {
            c.updateSchedule(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        changeSlotState: d => new Promise((resolve, reject) => {
            c.changeSlotState(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        changeCabinet: d => new Promise((resolve, reject) => {
            c.changeCabinet(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        deleteSchedule: d => new Promise((resolve, reject) => {
            c.deleteSchedule(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        updateSickLeaves: d => new Promise((resolve, reject) => {
            c.updateSickLeaves(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        updateDistrict: d => new Promise((resolve, reject) => {
            c.updateDistrict(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getScheduleInfo: d => new Promise((resolve, reject) => {
            c.getScheduleInfo(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getAppointmentsBySNILS: d => new Promise((resolve, reject) => {
            c.getAppointmentsBySNILS(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        readSlotState: d => new Promise((resolve, reject) => {
            c.readSlotState(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        deleteSlot: d => new Promise((resolve, reject) => {
            c.deleteSlot(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        findDistrict: d => new Promise((resolve, reject) => {
            c.findDistrict(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getActualSpecialistList: d => new Promise((resolve, reject) => {
            c.getActualSpecialistList(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getSlotListByPeriod: d => new Promise((resolve, reject) => {
            c.getSlotListByPeriod(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        })
    };
};

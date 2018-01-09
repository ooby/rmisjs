const rmisjs = require('../../index');
const createDates = require('../libs/collect').createDates;

const {
    getSchedFormat,
    schedFormat,
    schedFormatStruct,
    slotFormat
} = require('./format');

exports.syncSchedules = async(s, d) => {
    try {
        const er14 = await rmisjs(s).integration.er14.process();
        let bb = [];
        for (let i of d) {
            for (let j of i.interval) {
                let schedules = await er14.getScheduleInfo(
                    getSchedFormat({
                        scheduleDate: j.date,
                        muCode: s.er14.muCode,
                        needFIO: false
                    })
                );
                let rmIds = [];
                let count = 0;
                if (schedules.scheduleInfo) {
                    for (let k of [].concat(schedules.scheduleInfo.schedule)) {
                        if (k.docCode !== i.snils) continue;
                        if (!k.slot) continue;
                        for (let l of [].concat(k.slot)) {
                            for (let tp of j.timePeriod) {
                                if (l.slotInfo.GUID !== tp._id) continue;
                                rmIds.push(j.timePeriod.indexOf(tp));
                            }
                        }
                    }
                    for (let k of rmIds) j.timePeriod.splice(k, 1);
                }
                if (j.timePeriod.length <= 0) continue;
                let u = schedFormat({
                    scheduleDate: j.date,
                    muCode: s.er14.muCode,
                    deptCode: i.department.code,
                    docCode: i.snils,
                    roomNumber: i.room,
                    docSNILS: i.snils,
                    specCode: Array.isArray(i.speciality) ? i.speciality[0] : i.speciality,
                    positionCode: Array.isArray(i.position) ? i.position[0] : i.position
                });
                for (let k of j.timePeriod) {
                    u += slotFormat({
                        timeStart: k.from.replace(/\+09:00/g, 'Z'),
                        timeFinish: k.to.replace(/\+09:00/g, 'Z'),
                        slotType: 2,
                        GUID: k._id,
                        SlotState: k.status
                    });
                }
                let log = await er14.updateSchedule({
                    $xml: u
                });
                if (!log) continue;
                if (parseInt(log.ErrorCode) === 0) continue;
                log.location = i.location;
                console.error(log);
            }
        }
    } catch (e) {
        console.error(e);
        return e;
    }
};

exports.getSchedules = async(s, d) => {
    try {
        const er14 = await rmisjs(s).integration.er14.process();
        return await er14.getScheduleInfo(
            getSchedFormat({
                scheduleDate: d,
                muCode: s.er14.muCode,
                needFIO: false
            })
        );
    } catch (e) {
        console.error(e);
        return e;
    }
};

exports.deleteSchedulesForDates = async(s, ...dates) => {
    try {
        const er14 = await rmisjs(s).integration.er14.process();
        let result = [];
        for (let d of dates) {
            let i = await er14.getScheduleInfo(
                getSchedFormat({
                    scheduleDate: d,
                    muCode: s.er14.muCode,
                    needFIO: false
                })
            );
            if (!i.scheduleInfo) continue;
            for (let j of i.scheduleInfo.schedule) {
                let log = await er14.deleteSchedule(
                    schedFormatStruct({
                        scheduleDate: j.scheduleDate,
                        muCode: j.muCode,
                        deptCode: j.deptCode,
                        roomNumber: j.roomNumber,
                        docCode: j.docCode,
                        specCode: j.specCode,
                        positionCode: j.positionCode
                    })
                );
                if (!log) continue;
                if (parseInt(log.ErrorCode) === 0) continue;
                result.push(log);
            }
        }
        return result;
    } catch (e) {
        console.error(e);
        return e;
    }
};

exports.deleteSchedules = (s, from, to) =>
    exports.deleteSchedulesForDates(s, ...createDates(from, to));

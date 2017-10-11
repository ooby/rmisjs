const uid = require('uuid/v4');
const { getSchedFormat, schedFormat, slotFormat } = require('./format');
exports.syncSchedules = async (s, d) => {
    try {
        const rmisjs = require('../../index')(s);
        const er14 = await rmisjs.integration.er14.process();
        let r = d;
        let bb = [];
        for (let i of r) {
            for (let j of i.interval) {
                let data = getSchedFormat({
                    scheduleDate: j.date,
                    muCode: s.er14.muCode,
                    needFIO: false
                });
                let schedules = await er14.getScheduleInfo(data);
                let rmIds = [];
                let count = 0;
                if (schedules.scheduleInfo) {
                    schedules = schedules.scheduleInfo.schedule;
                    schedules = (Array.isArray(schedules)) ? schedules : new Array(schedules);
                    for (let k of schedules) {
                        if (k.docCode === i.snils) {
                            let slots = (Array.isArray(k.slot)) ? k.slot : new Array(k.slot);
                            for (let l of slots) {
                                for (let tp of j.timePeriod) {
                                    let from = l.timeInterval.timeStart;
                                    let lfrom = tp.from.replace(/\.000\+09:00/g, 'Z');
                                    if (from === lfrom) {
                                        rmIds.push(j.timePeriod.indexOf(tp));
                                    }
                                }
                            }
                        }
                    }
                    for (let k of rmIds) {
                        j.timePeriod.splice(k, 1);
                    }
                }
                if (j.timePeriod.length > 0) {
                    let d = {
                        scheduleDate: j.date,
                        muCode: s.er14.muCode,
                        deptCode: i.department.code,
                        roomNumber: i.room,
                        docCode: i.snils,
                        specCode: (Array.isArray(i.speciality)) ? i.speciality[0] : i.speciality,
                        positionCode: (Array.isArray(i.position)) ? i.position[0] : i.position
                    };
                    let u = schedFormat(d);
                    j.timePeriod.forEach(k => {
                        let ts = {
                            timeStart: k.from.replace(/\+09:00/g, 'Z'),
                            timeFinish: k.to.replace(/\+09:00/g, 'Z'),
                            slotType: 2,
                            GUID: uid(),
                            SlotState: 1
                        };
                        u = u + slotFormat(ts);
                    });
                    let rr = await er14.updateSchedule({ $xml: u });
                    bb.push(rr);
                }
            }
        }
        return bb;
    } catch (e) { return e; }
};

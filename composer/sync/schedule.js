const uid = require('uuid/v4');
const { getSchedFormat, schedFormat, slotFormat } = require('./format');
exports.syncSchedules = async (s, d) => {
    try {
        const rmisjs = require('../../index')(s);
        const er14 = await rmisjs.integration.er14.process();
        let r = d;
        let bb = [];
        debugger;
        for (let i of r) {
            for (let j of i.interval) {
                let data = getSchedFormat({
                    scheduleDate: j.date,
                    muCode: s.er14.muCode,
                    needFIO: false
                });
                let schedules = await er14.getScheduleInfo(data);
                if (schedules.scheduleInfo) {
                    schedules = schedules.scheduleInfo.schedule;
                    let rmIds = [];
                    for (let k of schedules) {
                        if (k.docCode === i.snils) {
                            let slots = (Array.isArray(k.slot)) ? k.slot : new Array(k.slot);
                            for (let l of slots) {
                                let tptpt = j.timePeriod.entries();
                                for (let [tpId, tp] of tptpt) {
                                    let from = l.timeInterval.timeStart;
                                    let to = l.timeInterval.timeFinish;
                                    if (from === tp.from.replace(/\+09:00/g, 'Z') &&
                                        to === tp.to.replace(/\+09:00/g, 'Z')) {
                                        rmIds.push(tpId);
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

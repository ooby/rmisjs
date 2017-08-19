const uid = require('uuid/v4');
const { getSchedFormat, schedFormat, slotFormat } = require('./format');
exports.syncSchedules = async s => {
    try {
        const rmisjs = require('../../index')(s);
        const composer = rmisjs.composer;
        const er14 = await rmisjs.integration.er14.process();
        let r = await composer.getDetailedLocations();
        let bb = [];
        await r.reduce((p, i) => p.then(async () => {
            await i.interval.reduce((p, j) => p.then(async () => {
                let data = getSchedFormat({
                    scheduleDate: j.date,
                    muCode: s.er14.muCode,
                    needFIO: false
                });
                let d = await er14.getSheduleInfo(data);
                bb.push(d);
                /* let d = {
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
                bb.push(u);*/
                return j;
            }), Promise.resolve());
            return i;
        }), Promise.resolve());
        return bb;
    } catch (e) { return e; }
};

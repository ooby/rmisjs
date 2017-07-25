const fs = require('fs');
const uid = require('uuid/v4');
const schedFormat = d => {
    return '<ct:scheduleDate>' + d.scheduleDate + '</ct:scheduleDate>' +
        '<ct:muCode>' + d.muCode + '</ct:muCode>' +
        '<ct:deptCode>' + d.deptCode + '</ct:deptCode>' +
        '<ct:roomNumber>' + d.roomNumber + '</ct:roomNumber>' +
        '<ct:docCode>' + d.docCode + '</ct:docCode>' +
        '<ct:specCode>' + d.specCode + '</ct:specCode>' +
        '<ct:positionCode>' + d.positionCode + '</ct:positionCode>'
};
const slotFormat = d => {
    return '<pt:SlotElement>' +
        '<ct:timeInterval>' +
        '<ct:timeStart>' + d.timeStart + '</ct:timeStart>' +
        '<ct:timeFinish>' + d.timeFinish + '</ct:timeFinish>' +
        '</ct:timeInterval>' +
        '<ct:slotType>' + d.slotType + '</ct:slotType>' +
        '<ct:slotInfo>' +
        '<ct:GUID>' + d.GUID + '</ct:GUID>' +
        '<ct:SlotState>' + d.SlotState + '</ct:SlotState>' +
        '</ct:slotInfo>' +
        '</pt:SlotElement>'
};
exports.syncSchedules = s => {
    return new Promise(async (resolve, reject) => {
        try {
            const rmisjs = require('../../index')(s);
            const composer = rmisjs.composer;
            const er14 = await rmisjs.integration.er14.process();
            let r = await composer.getDetailedLocations();
            let result = [];
            let bb = '';
            await r.reduce((p, i) => p.then(async () => {
                await i.interval.reduce((g, j) => g.then(async () => {
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
                    bb = bb + u;
                    let rr = await er14.updateSсhedule({ _xml: u });
                    result.push(rr);
                    return j;
                }), Promise.resolve());
                return i;
            }), Promise.resolve());
            fs.writeFileSync('debug.xml', bb);
            resolve(result);
        } catch (e) { reject(e); }
    });
};
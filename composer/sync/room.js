const roomFormat = require('./format').roomFormat;
const rmisjs = require('../../index');

exports.syncRooms = async (s, d) => {
    try {
        const er14 = await rmisjs(s).integration.er14.process();
        let r = await er14.getMuInfo({
            'pt:muCode': s.er14.muCode
        });
        let result = [];
        for (let i of r.muInfo.department) {
            if (!!i.deleted || !i.room) continue;
            for (let j of [].concat(i.room)) {
                if (!!j.deleted) continue;
                let log = await er14.updateCabinetInfo(
                    roomFormat({
                        muCode: s.er14.muCode,
                        deptCode: i.deptCode,
                        roomNumber: j.roomNumber,
                        deleted: true
                    })
                );
                if (parseInt(log.ErrorCode) !== 0) result.push(log);
            }
        }
        for (let i of d) {
            let log = await er14.updateCabinetInfo(
                roomFormat({
                    muCode: s.er14.muCode,
                    deptCode: i.department.code,
                    roomNumber: i.room,
                    deleted: false
                })
            );
            if (parseInt(log.ErrorCode) !== 0) result.push(log);
        }
        return result;
    } catch (e) {
        console.error(e);
        return e;
    }
};

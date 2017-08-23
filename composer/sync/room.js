const { roomFormat } = require('./format');
exports.syncRooms = async (s, d) => {
    try {
        const rmisjs = require('../../index')(s);
        const er14 = await rmisjs.integration.er14.process();
        let r = await er14.getMuInfo({ 'pt:muCode': s.er14.muCode });
        let rs = [];
        for (let i of r.muInfo.department) {
            if (!i.deleted && i.room) {
                if (Array.isArray(i.room)) {
                    i.room.forEach(j => {
                        if (!j.deleted) {
                            let d = {
                                muCode: s.er14.muCode,
                                deptCode: i.deptCode,
                                roomNumber: j.roomNumber,
                                deleted: true
                            };
                            let u = roomFormat(d);
                            rs.push(u);
                        }
                    });
                } else {
                    if (!i.room.deleted) {
                        let d = {
                            muCode: s.er14.muCode,
                            deptCode: i.deptCode,
                            roomNumber: i.room.roomNumber,
                            deleted: true
                        };
                        let u = roomFormat(d);
                        rs.push(u);
                    }
                }
            }
        }
        let result = [];
        for (let i of rs) {
            let res = await er14.updateCabinetInfo(i);
            result.push(res);
        }
        r = d;
        for (let i of r) {
            let d = {
                muCode: s.er14.muCode,
                deptCode: i.department.code,
                roomNumber: i.room,
                deleted: false
            };
            let u = roomFormat(d);
            let res = await er14.updateCabinetInfo(u);
            result.push(res);
        }
        return result;
    } catch (e) { return e; }
};

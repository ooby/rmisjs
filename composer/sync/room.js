const { roomFormat } = require('./format');
exports.syncRooms = async s => {
    try {
        const rmisjs = require('../../index')(s);
        const composer = rmisjs.composer;
        const er14 = await rmisjs.integration.er14.process();
        let r = await er14.getMuInfo({ 'pt:muCode': s.er14.muCode });
        let rs = [];
        await r.muInfo.department.reduce((p, i) => p.then(async () => {
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
            return i;
        }), Promise.resolve());
        let result = [];
        await rs.reduce((p, i) => p.then(async () => {
            try {
                let res = await er14.updateCabinetInfo(i);
                result.push(res);
            } catch (e) { console.error(e); }
            return i;
        }), Promise.resolve());
        r = await composer.getDetailedLocations();
        await r.reduce((p, i) => p.then(async () => {
            try {
                let d = {
                    muCode: s.er14.muCode,
                    deptCode: i.department.code,
                    roomNumber: i.room,
                    deleted: false
                };
                let u = roomFormat(d);
                let res = await er14.updateCabinetInfo(u);
                result.push(res);
            } catch (e) { console.error(e); }
            return i;
        }), Promise.resolve());
        return result;
    } catch (e) { return e; }
};

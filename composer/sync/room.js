const roomFormat = d => {
    return {
        'pt:muCode': d.muCode,
        'pt:deptCode': d.deptCode,
        'pt:roomInfo': {
            'ct:roomNumber': d.roomNumber,
            'ct:deleted': d.deleted
        }
    }
};
exports.syncRooms = s => {
    const rmisjs = require('../../index')(s);
    const composer = rmisjs.composer;
    const er14 = rmisjs.integration.er14;
    return new Promise(async (resolve, reject) => {
        try {
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
            resolve(result);
        } catch (e) { reject(e); }
    });
};
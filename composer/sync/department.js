const deptFormat = d => {
    return {
        'ct:deptCode': d.deptCode,
        'ct:deptName': d.deptName,
        'ct:deptType': d.deptType,
        'ct:deleted': d.deleted
    }
};
exports.syncDepartments = s => {
    return new Promise(async (resolve, reject) => {
        try {
            const rmisjs = require('../../index')(s);
            const composer = rmisjs.composer;
            const er14 = await rmisjs.integration.er14.process();
            let r = await er14.getMuInfo({ 'pt:muCode': s.er14.muCode });
            let res = [];
            r.muInfo.department.forEach(i => {
                if (!i.deleted) { res.push(i); }
            });
            let result = [];
            await res.reduce((p, i) => p.then(async () => {
                try {
                    i.deleted = true;
                    let u = deptFormat(i);
                    let data = {
                        'pt:muCode': s.er14.muCode,
                        'pt:department': u
                    };
                    let rr = await er14.updateMuInfo(data);
                    result.push(rr);
                } catch (e) { console.error(e); }
                return i;
            }), Promise.resolve());
            let dl = await composer.getDetailedLocations();
            await dl.reduce((p, i) => p.then(async () => {
                try {
                    let data = {
                        deptCode: i.department.code,
                        deptName: i.department.name,
                        deptType: i.department.type,
                        deleted: false
                    };
                    let u = deptFormat(data);
                    data = {
                        'pt:muCode': s.er14.muCode,
                        'pt:department': u
                    };
                    let rr = await er14.updateMuInfo(data);
                    result.push(rr);
                } catch (e) { console.error(e); }
                return i;
            }), Promise.resolve());
            resolve(result);
        } catch (e) { reject(e); }
    });
};
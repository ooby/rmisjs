const { deptFormat } = require('./format');
exports.syncDepartments = async (s, d) => {
    try {
        const rmisjs = require('../../index')(s);
        const er14 = await rmisjs.integration.er14.process();
        let r = await er14.getMuInfo({ 'pt:muCode': s.er14.muCode });
        let res = [];
        r.muInfo.department.forEach(i => {
            if (!i.deleted) { res.push(i); }
        });
        let result = [];
        for (let i of res) {
            i.deleted = true;
            let u = deptFormat(i);
            let data = {
                'pt:muCode': s.er14.muCode,
                'pt:department': u
            };
            let rr = await er14.updateMuInfo(data);
            result.push(rr);
        }
        let dl = d;
        for (let i of dl) {
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
        }
        return result;
    } catch (e) { return e; }
};

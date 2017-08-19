const { getDepartment, getDepartments } = require('./collect');
exports.getDetailedDepartments = async s => {
    try {
        let r = await getDepartments(s);
        let result = [];
        await r.department.reduce((p, c) => p.then(async () => {
            let k = await getDepartment(s, c);
            result.push(k);
            return c;
        }), Promise.resolve());
        r = result;
        return r;
    } catch (e) { return e; }
};
exports.getPortalDepartments = async s => {
    try {
        let r = await getDepartments(s);
        let result = [];
        await r.department.reduce((p, c) => p.then(async () => {
            let k = await getDepartment(s, c);
            if (k.portalDepartment && k.portalDepartment.isVisible) {
                result.push(Object.assign(k, { id: c }));
            }
            return c;
        }), Promise.resolve());
        r = result;
        return r;
    } catch (e) { return e; }
};

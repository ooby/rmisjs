const {
    getDepartment,
    getDepartments
} = require('./collect');

exports.getDetailedDepartments = async s => {
    try {
        let r = await getDepartments(s);
        let result = [];
        for (let i of r.department) {
            let k = await getDepartment(s, i);
            result.push(k);
        }
        return result;
    } catch (e) {
        console.error(e);
        return e;
    }
};

exports.getPortalDepartments = async s => {
    try {
        let r = await getDepartments(s);
        let result = [];
        for (let i of r.department) {
            let k = await getDepartment(s, i);
            if (!k.portalDepartment) continue;
            if (!k.portalDepartment.isVisible) continue;
            result.push(
                Object.assign(k, {
                    id: i
                })
            );
        }
        return result;
    } catch (e) {
        console.error(e);
        return e;
    }
};

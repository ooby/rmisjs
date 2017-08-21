const {
    getEmployee,
    getEmployees,
    getEmployeeSpecialities,
    getEmployeePosition,
    getEmployeePositions,
    getIndividual,
    getRefbook,
    getRefbookList,
    getVersionList
} = require('./collect');
exports.getDetailedEmployees = async s => {
    try {
        let r = await getEmployees(s);
        let result = [];
        for (let i of r.employee) {
            let k = await getEmployee(s, i);
            result.push(Object.assign(k, { id: i }));
        }
        r = result.filter(i => !!i).filter(i => !!i.individual);
        result = [];
        for (let i of r) {
            let k = await getIndividual(s, i.individual);
            result.push(Object.assign(i, k));
        }
        r = result.filter(i => !!i.surname)
            .filter(i => !!i.name)
            .filter(i => !!i.patrName);
        for (let i of r) {
            Object.assign(i, { firstName: i.name });
            delete i.name;
        }
        result = [];
        for (let i of r) {
            let k = await getEmployeeSpecialities(s, i.id);
            let obj = { speciality: '' };
            if (k) {
                if (Array.isArray(k.speciality)) {
                    Object.assign(obj, { speciality: k.speciality[0] });
                } else {
                    Object.assign(obj, { speciality: k.speciality });
                }
            }
            result.push(Object.assign(i, obj));
        }
        r = result.filter(i => !!i.speciality);
        for (let i of r) {
            let fio = i.surname.toUpperCase() + ' ' + i.firstName.toUpperCase() + ' ' + i.patrName.toUpperCase();
            Object.assign(i, { fio: fio });
            delete i.number;
            delete i.dismissed;
            delete i.gender;
            delete i.note;
        }
        return r;
    } catch (e) { return e; }
};

const {
    getEmployee,
    getEmployees,
    getEmployeeSpecialities,
    getIndividual
} = require('./collect');

exports.getDetailedEmployees = async s => {
    try {
        let r = await getEmployees(s);
        let result = [];
        for (let i of r.employee) {
            let k = await getEmployee(s, i);
            if (!k) continue;
            if (!k.individual) continue;
            let data = Object.assign(k, {
                id: i
            });
            k = await getIndividual(s, data.individual);
            if (!k) continue;
            if (!k.surname || !k.name || !k.patrName) continue;
            k.fio = [k.surname, k.name, k.patrName].map(j => j.toUpperCase()).join(' ');
            k.firstname = k.name;
            delete k.name;
            data = Object.assign(data, k);
            k = await getEmployeeSpecialities(s, data.id);
            if (!k) continue;
            if (!k.speciality) continue;
            data = Object.assign(data, {
                speciality: Array.isArray(k.speciality) ? k.speciality[0] : k.speciality
            })
            delete data.number;
            delete data.dismissed;
            delete data.gender;
            delete data.note;
            result.push(data);
        }
        return result;
    } catch (e) {
        console.error(e);
        return e;
    }
};

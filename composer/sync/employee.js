const { empFormat } = require('./format');
exports.syncEmployees = async (s, d) => {
    try {
        const rmisjs = require('../../index')(s);
        const er14 = await rmisjs.integration.er14.process();
        let r = d;
        let result = [];
        for (let i of r) {
            let d = {
                docCode: i.snils,
                snils: i.snils,
                firstName: i.firstName,
                middleName: i.patrName,
                lastName: i.surname,
                specCode: (Array.isArray(i.speciality)) ? i.speciality[0] : i.speciality,
                positionCode: (Array.isArray(i.position)) ? i.position[0] : i.position,
                muCode: s.er14.muCode
            };
            let u = empFormat(d);
            let rr = await er14.updateStaffInfo(u);
            result.push(rr);
        }
        return result;
    } catch (e) { return e; }
};

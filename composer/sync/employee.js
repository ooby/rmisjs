const { empFormat } = require('./format');
const rmisjs = require('../../index');

exports.syncEmployees = async (s, d) => {
    try {
        const er14 = await rmisjs(s).integration.er14.process();
        let result = [];
        for (let i of d) {
            let log = await er14.updateStaffInfo(
                empFormat({
                    docCode: i.snils,
                    snils: i.snils,
                    firstName: i.firstName,
                    middleName: i.patrName,
                    lastName: i.surname,
                    specCode: Array.isArray(i.speciality) ? i.speciality[0] : i.speciality,
                    positionCode: Array.isArray(i.position) ? i.position[0] : i.position,
                    muCode: s.er14.muCode
                })
            );
            if (parseInt(log.ErrorCode) !== 0) result.push(log);
        }
        return result;
    } catch (e) {
        console.error(e);
        return e;
    }
};

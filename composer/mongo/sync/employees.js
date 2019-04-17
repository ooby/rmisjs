const Location = require('../model/location');
const Employee = require('../model/employee');

const {
    getRefbook,
    getEmployeePosition,
    getEmployee,
    getPosition,
    getIndividualDocuments,
    getIndividual,
    getDocument
} = require('../../libs/collect');

/**
 * Выгрузка данных из РМИС о сотрудниках
 * @param {Object} s - конфигурация
 */
module.exports = async s => {
    let specs = await getRefbook(s, {
        code: '1.2.643.5.1.13.3.2861820518965.1.1.118',
        version: 'CURRENT'
    });
    specs = new Map(
        specs.row.map(i => {
            let r = [];
            for (let col of i.column) {
                if (r.length == 2) break;
                if (col.name === 'ID') r[0] = col.data;
                else if (col.name === 'NAME') r[1] = col.data;
            }
            return r;
        })
    );
    let positions = await Location.distinct('positions').exec();
    await Promise.all(
        []
            .concat(
                Employee.remove({
                    position: {
                        $nin: positions
                    }
                }).exec()
            )
            .concat(
                positions.map(async positionId => {
                    try {
                        let data = {
                            position: positionId
                        };
                        let employeePosition = await getEmployeePosition(
                            s,
                            positionId
                        );
                        data._id = employeePosition.employee;
                        let position = await getPosition(
                            s,
                            employeePosition.position
                        );
                        if (!position.speciality) return;
                        data.positionName = position.name;
                        data.speciality = position.speciality;
                        data.specialityName = specs.get(data.speciality);
                        let employee = await getEmployee(
                            s,
                            employeePosition.employee
                        );
                        data.individual = employee.individual;
                        let documents = await getIndividualDocuments(
                            s,
                            employee.individual
                        );
                        if (!documents) return;
                        for (let documentId of [].concat(documents)) {
                            let documentData = await getDocument(s, documentId);
                            if (parseInt(documentData.type) !== 19) continue; // 19 = SNILS
                            data.snils = documentData.number.replace(
                                /[-\s]/g,
                                ''
                            );
                            break;
                        }
                        if (!data.snils) return;
                        let individual = await getIndividual(
                            s,
                            employee.individual
                        );
                        data.surname = individual.surname;
                        data.patrName = individual.patrName;
                        data.firstName = individual.name;
                        if (!!employee.birthDate)
                            data.birthDate = new Date(employee.birthDate);
                        await Employee.update(
                            {
                                _id: employeePosition.employee
                            },
                            data,
                            {
                                upsert: true
                            }
                        ).exec();
                    } catch (e) {
                        console.error(e);
                    }
                })
            )
    );
};

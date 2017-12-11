const Location = require('../model/location');
const Employee = require('../model/employee');

module.exports = async(rmis) => {
    let refbook = await rmis.refbook();
    let specs = await refbook.getRefbook({
        refbookCode: '1.2.643.5.1.13.3.2861820518965.1.1.118',
        version: 'CURRENT'
    });
    specs = new Map(
        specs.row.map(i => {
            let r = [];
            for (let col of i.column) {
                if (col.name === 'ID') {
                    r[0] = col.data;
                } else if (col.name === 'NAME') {
                    r[1] = col.data;
                }
            }
            return r;
        })
    );
    let [emp, ind, positions] = await Promise.all([
        rmis.employee(),
        rmis.individual(),
        Location.distinct('positions').exec()
    ]);
    let promises = [
        Employee.remove({
            position: {
                $nin: positions
            }
        }).exec()
    ];
    for (let positionId of positions) {
        let data = {
            position: positionId
        };
        let employeePosition = await emp.getEmployeePosition({
            id: positionId
        });
        employeePosition = employeePosition.employeePosition;
        data._id = employeePosition.employee;
        let position = await emp.getPosition({
            id: employeePosition.position
        });
        position = position.position;
        if (!position.speciality) continue;
        data.positionName = position.name;
        data.speciality = position.speciality;
        data.specialityName = specs.get(data.speciality);
        let employee = await emp.getEmployee({
            id: employeePosition.employee
        });
        employee = employee.employee;
        data.individual = employee.individual;
        let documents = await ind.getIndividualDocuments(employee.individual);
        if (!documents) continue;
        for (let documentId of [].concat(documents.document)) {
            let documentData = await ind.getDocument(documentId);
            if (documentData.type !== '19') continue;
            data.snils = documentData.number.replace(/[-\s]/g, '');
            break;
        }
        let individual = await ind.getIndividual(employee.individual);
        data.surname = individual.surname;
        data.patrName = individual.patrName;
        data.firstName = individual.name;
        if (!data.snils) continue;
        if (!!employee.birthDate) data.birthDate = new Date(employee.birthDate);
        promises.push(
            Employee.update({
                _id: employeePosition.employee
            }, data, {
                upsert: true
            }).exec()
        );
    }
    await Promise.all(promises);
};

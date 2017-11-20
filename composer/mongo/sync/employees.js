const {
    Location,
    Employee
} = require('../model');

module.exports = async(rmis) => {
    let [emp, ind] = await Promise.all([
        rmis.employee(),
        rmis.individual()
    ]);
    let positions = await Location.distinct('positions').exec();
    await Employee.remove({
        position: {
            $nin: positions
        }
    }).exec();
    for (let positionId of positions) {
        let employeePosition = await emp.getEmployeePosition({
            id: positionId
        });
        employeePosition = employeePosition.employeePosition;
        let position = await emp.getPosition({
            id: employeePosition.position
        });
        position = position.position;
        if (!position.speciality) continue;
        let employee = await emp.getEmployee({
            id: employeePosition.employee
        });
        employee = employee.employee;
        let individual = await ind.getIndividual(employee.individual);
        let documents = await ind.getIndividualDocuments(employee.individual);
        if (!documents) continue;
        let data = {
            rmisId: employeePosition.employee,
            surname: individual.surname,
            patrName: individual.patrName,
            firstName: individual.name,
            speciality: position.speciality,
            positionName: position.name,
            individual: employee.individual,
            position: positionId
        };
        for (let documentId of [].concat(documents.document)) {
            let documentData = await ind.getDocument(documentId);
            if (documentData.type === '19') {
                data.snils = documentData.number.replace(/[-\s]/g, '');
                break;
            }
        }
        if (!data.snils) continue;
        if (!!employee.birthDate) {
            data.birthDate = new Date(employee.birthDate);
        }
        await Employee.update({
            rmisId: employeePosition.employee
        }, data, {
            upsert: true
        }).exec();
    }
};
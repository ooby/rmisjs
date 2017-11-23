const Department = require('../model/department');

module.exports = async(composer) => {
    let depts = await composer.getPortalDepartments();
    let promises = [
        Department.remove({
            rmisId: {
                $nin: depts.map(i => i.id)
            }
        }).exec()
    ];
    for (let dept of depts) {
        dept.rmisId = dept.id;
        dept.type = dept.departmentType;
        promises.push(
            Department.update({
                rmisId: dept.id
            }, dept, {
                upsert: true
            }).exec()
        );
    }
    await Promise.all(promises);
};

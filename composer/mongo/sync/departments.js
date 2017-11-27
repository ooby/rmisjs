const Department = require('../model/department');

module.exports = async(composer) => {
    let depts = await composer.getPortalDepartments();
    let promises = [
        Department.remove({
            _id: {
                $nin: depts.map(i => i.id)
            }
        }).exec()
    ];
    for (let dept of depts) {
        dept._id = dept.id;
        dept.type = dept.departmentType;
        promises.push(
            Department.update({
                _id: dept.id
            }, dept, {
                upsert: true
            }).exec()
        );
    }
    await Promise.all(promises);
};

const { Department } = require('../model');

module.exports = async (composer) => {
    let depts = await composer.getPortalDepartments();
    await Department.remove({
        rmisId: { $nin: depts.map(i => i.id) }
    }).exec();
    for (let dept of depts) {
        dept.rmisId = dept.id;
        await Department.update({
            rmisId: dept.id
        }, dept, {
            upsert: true
        }).exec();
    }
};

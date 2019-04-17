const { getPortalDepartments } = require('../../libs/department');
const Department = require('../model/department');

/**
 * Выгрузка данных из РМИС об отделениях
 * @param {Object} s - конфигурация
 */
module.exports = async s => {
    let depts = await getPortalDepartments(s);
    let ids = depts.map(i => i.id);
    await Promise.all(
        [Department.remove({ _id: { $nin: ids } }).exec()].concat(
            depts.map(async dept => {
                try {
                    dept._id = dept.id;
                    dept.type = dept.departmentType;
                    await Department.update({ _id: dept.id }, dept, {
                        upsert: true
                    }).exec();
                } catch (e) {
                    console.error(e);
                }
            })
        )
    );
};

const getPortalDepartments = require('../../libs/department').getPortalDepartments;
const Department = require('../model/department');
const $ = require('../uncatch');

/**
 * Выгрузка данных из РМИС об отделениях
 * @param {Object} s - конфигурация
 */
module.exports = async s => {
    let depts = await $(() => getPortalDepartments(s));
    await Promise.all(
        [].concat(
            Department.remove({
                _id: {
                    $nin: depts.map(i => i.id)
                }
            }).exec()
        ).concat(
            depts.map(async dept => {
                dept._id = dept.id;
                dept.type = dept.departmentType;
                await Department.update({
                    _id: dept.id
                }, dept, {
                    upsert: true
                }).exec();
            })
        )
    );
};

const Department = require('../model/department');
const $ = require('../uncatch');
const getPortalDepartments = require('../../libs/department').getPortalDepartments;

/**
 * Выгрузка данных из РМИС об отделениях
 * @param {Object} s - конфигурация
 */
module.exports = async s => {
    console.log('Syncing departments...');
    let depts = await $(() => getPortalDepartments(s));
    await Department.remove({
        _id: {
            $nin: depts.map(i => i.id)
        }
    }).exec();
    await Promise.all(
        depts.map(async (dept) => {
            dept._id = dept.id;
            dept.type = dept.departmentType;
            await Department.update({
                _id: dept.id
            }, dept, {
                upsert: true
            }).exec();
        })
    );
};

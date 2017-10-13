const {
    getPatientReg,
    getPatientRegs,
    searchIndividual
} = require('./collect');

/**
 * Валидация пациента о наличии и прикреплении в больнице
 * @param {object} s - конфигурация
 * @param {object} m - параметры поиска
 * @param {string} m.birthDate - дата рождения - '1980-01-31'
 * @param {object} m.searchDocument - параметры документа
 * @param {number} m.searchDocument.docTypeId - тип документа - 26 для полиса
 * @param {number} m.searchDocument.docNumber - номер документа
 * @return {object}
 */
exports.validatePatient = async (s, m) => {
    try {
        let r = await searchIndividual(s, m);
        r = await getPatientRegs(s, r);
        r = await getPatientReg(s, r);
        return r;
    } catch (e) { return e; }
};

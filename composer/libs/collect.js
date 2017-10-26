const moment = require('moment');

/**
 * Подключает библиотеки rmisjs
 * @param {object} s - конфигурация
 * @return {object}
 */
const rmisjs = s => {
    const rmjs = require('../../index')(s);
    return rmjs.rmis;
};

/**
 * Создание талона по данным пациента
 * @param {object} s - конфигурация
 * @param {object} d - данные пациента
 * @return {object}
 */
exports.postReserve = async (s, d) => {
    const rmis = rmisjs(s);
    try {
        let r = await rmis.appointment();
        r = await r.postReserve(d);
        r = (r) ? r.slot : null;
        return r;
    } catch (e) { return e; };
};

/**
 * Получение списка записей по данным пациента
 * @param {object} s - конфигурация
 * @param {object} d - данные пациента
 * @return {object}
 */
exports.getReserve = async (s, d) => {
    const rmis = rmisjs(s);
    try {
        let r = await rmis.appointment();
        r = await r.getReserve(d);
        r = (r) ? r.slot : null;
        return r;
    } catch (e) { return e; };
};

/**
 * Получение информации талона по id
 * @param {object} s - конфигурация
 * @param {object} d - объект слота
 * @return {object}
 */
exports.getSlot = async (s, d) => {
    const rmis = rmisjs(s);
    try {
        let r = await rmis.appointment();
        r = await r.getSlot(d);
        // r = (r) ? r.slot : null;
        return r;
    } catch (e) { return e; };
};

/**
 * Создание записи пациента по номеру физлица
 * @param {object} s - конфигурация
 * @param {object} d - данные пациента
 * @return {object}
 */
exports.createPatient = async (s, d) => {
    const rmis = rmisjs(s);
    try {
        let r = await rmis.patient();
        r = await r.createPatient(d);
        // r = (r) ? r.note : null;
        return r;
    } catch (e) { return e; };
};

/**
 * Получение пациента по номеру физлица
 * @param {object} s - конфигурация
 * @param {object} id - идентификатор физического лица
 * @return {object}
 */
exports.getPatient = async (s, id) => {
    const rmis = rmisjs(s);
    try {
        let r = await rmis.patient();
        r = await r.getPatient(id);
        // r = (r) ? r.note : null;
        return r;
    } catch (e) { return e; };
};

/**
 * Получение информации о прикреплениях пациента
 * @param {object} s - конфигурация
 * @param {object} id - идентификатор физического лица
 * @return {object}
 */
exports.getPatientRegs = async (s, id) => {
    const rmis = rmisjs(s);
    try {
        let r = await rmis.patient();
        r = await r.getPatientRegs(id);
        r = (r) ? r.registration : null;
        return r;
    } catch (e) { return e; };
};

/**
 * Получение информации о прикреплении пациента
 * @param {object} s - конфигурация
 * @param {object} id - идентификатор прикрепления
 * @return {object}
 */
exports.getPatientReg = async (s, id) => {
    const rmis = rmisjs(s);
    try {
        let r = await rmis.patient();
        r = await r.getPatientReg(id);
        return r;
    } catch (e) { return e; };
};

/**
 * Поиск физического лица по параметрам
 * @param {object} s - конфигурация
 * @param {object} params - параметры поиска
 * @return {object}
 */
exports.searchIndividual = async (s, params) => {
    const rmis = rmisjs(s);
    try {
        let r = await rmis.individual();
        r = await r.searchIndividual(params);
        r = (r) ? r.individual : null;
        return r;
    } catch (e) { return e; };
};

/**
 * Запрашивает подразделение по идентификатору
 * @param {object} s - конфигурация
 * @param {number} id - идентификатор подразделения
 * @return {object}
 */
exports.getDepartment = async (s, id) => {
    const rmis = rmisjs(s);
    try {
        let r = await rmis.department();
        r = await r.getDepartment({ departmentId: id });
        r = (r) ? r.department : null;
        return r;
    } catch (e) { return e; };
};

/**
 * Запрашивает и возвращает список подразделений
 * @param {object} s - конфигурация
 * @return {object}
 */
exports.getDepartments = async (s) => {
    const rmis = rmisjs(s);
    try {
        let r = await rmis.department();
        r = await r.getDepartments({ clinic: s.rmis.clinicId });
        return r;
    } catch (e) { return e; };
};

/**
 * Запрашивает и возвращает справочник по коду и версии
 * @param {object} s - конфигурация
 * @param {object} id - объект с кодом и версией справочника
 * @return {object}
 */
exports.getRefbook = async (s, id) => {
    const rmis = rmisjs(s);
    try {
        let r = await rmis.refbook();
        r = await r.getRefbook({ refbookCode: id.code, version: id.version });
        return r;
    } catch (e) { return e; };
};

/**
 * Запрашивает и возвращает список справочников
 * @param {object} s - конфигурация
 * @return {object}
 */
exports.getRefbookList = async (s) => {
    const rmis = rmisjs(s);
    try {
        let r = await rmis.refbook();
        r = await r.getRefbookList();
        return r;
    } catch (e) { return e; };
};

/**
 * Запрашивает и возвращает список версий справочника по коду
 * @param {object} s - конфигурация
 * @param {string} id - код справочника
 * @return {object}
 */
exports.getVersionList = async (s, id) => {
    const rmis = rmisjs(s);
    try {
        let r = await rmis.refbook();
        r = await r.getVersionList({ refbookCode: id });
        r = (r) ? r.version : null;
        return r;
    } catch (e) { return e; };
};

/**
 * Запрашивает и возвращает ресурс по идентификатору
 * @param {object} s - конфигурация
 * @param {string} id - идентификатор ресурса
 * @return {object}
 */
exports.getLocation = async (s, id) => {
    const rmis = rmisjs(s);
    try {
        let r = await rmis.resource();
        r = await r.getLocation({ location: id });
        r = (r) ? r.location : null;
        return r;
    } catch (e) { return e; };
};

/**
 * Запрашивает и возвращает список идентификаторов ресурсов
 * @param {object} s - конфигурация
 * @return {object}
 */
exports.getLocations = async s => {
    const rmis = rmisjs(s);
    try {
        let r = await rmis.resource();
        r = await r.getLocations({ clinic: s.rmis.clinicId });
        return r;
    } catch (e) { return e; }
};

/**
 * Запрашивает и возвращает список идентификаторов ресурсов
 * @param {object} s - конфигурация
 * @param {object} d - параметры запроса
 * @return {object}
 */
exports.getLocationsWithOptions = async (s, d) => {
    const rmis = rmisjs(s);
    try {
        let r = await rmis.resource();
        r = await r.getLocations(d);
        return r;
    } catch (e) { return e; }
};

/**
 * Запрашивает и возвращает список таймслотов для расписания
 * по идентификатору ресурса и дате расписания
 * @param {object} s - конфигурация
 * @param {string} id - идентификатор ресурса
 * @param {date} date - дата расписания
 * @return {object}
 */
exports.getTimes = async (s, id, date) => {
    const rmis = rmisjs(s);
    try {
        let r = await rmis.appointment();
        r = await r.getTimes({ location: id, date: date });
        r = (r) ? r.interval : null;
        return r;
    } catch (e) { return e; }
};

/**
 * Запрашивает и возвращает кабинет приема по идентификатору
 * @param {object} s - конфигурация
 * @param {number} id - идентификатор кабинета приема
 * @return {object}
 */
exports.getRoom = async (s, id) => {
    const rmis = rmisjs(s);
    try {
        let r = await rmis.room();
        r = await r.getRoom({ roomId: id });
        r = (r) ? r.room : null;
        return r;
    } catch (e) { return e; };
};

/**
 * Запрашивает и возвращает список идентификаторов кабинетов приема
 * @param {object} s - конфигурация
 * @return {object}
 */
exports.getRooms = async s => {
    const rmis = rmisjs(s);
    try {
        let r = await rmis.room();
        r = await r.getRooms({ clinic: s.rmis.clinicId });
        return r;
    } catch (e) { return e; }
};

/**
 * Запрашивает и возвращает сотрудника по идентификатору
 * @param {object} s - конфигурация
 * @param {number} id - идентификатор сотрудника
 * @return {object}
 */
exports.getEmployee = async (s, id) => {
    const rmis = rmisjs(s);
    try {
        let r = await rmis.employee();
        r = await r.getEmployee({ id: id });
        r = (r) ? r.employee : null;
        return r;
    } catch (e) { return e; };
};

/**
 * Запрашивает и возвращает список идентификаторов сотрудников
 * @param {object} s - конфигурация
 * @return {object}
 */
exports.getEmployees = async s => {
    const rmis = rmisjs(s);
    try {
        let r = await rmis.employee();
        r = await r.getEmployees({ organization: s.rmis.clinicId });
        return r;
    } catch (e) { return e; }
};

/**
 * Запрашивает и возвращает должность сотрудника по идентификатору должности
 * @param {object} s - конфигурация
 * @param {number} id - идентификатор должности сотрудника
 * @return {object}
 */
exports.getEmployeePosition = async (s, id) => {
    const rmis = rmisjs(s);
    try {
        let r = await rmis.employee();
        r = await r.getEmployeePosition({ id: id });
        r = (r) ? r.employeePosition : null;
        return r;
    } catch (e) { return e; };
};

/**
 * Запрашивает и возвращает список идентификаторов должностей сотрудника 
 * по идентификатору сотрудника
 * @param {object} s - конфигурация
 * @param {number} id - идентификатор сотрудника
 * @return {object}
 */
exports.getEmployeePositions = async (s, id) => {
    const rmis = rmisjs(s);
    try {
        let r = await rmis.employee();
        r = await r.getEmployeePositions({ employee: id });
        return r;
    } catch (e) { return e; };
};

/**
 * Запрашивает и возвращает список идентификаторов специальностей сотрудника 
 * по идентификатору сотрудника
 * @param {object} s - конфигурация
 * @param {number} id - идентификатор сотрудника
 * @return {object}
 */
exports.getEmployeeSpecialities = async (s, id) => {
    const rmis = rmisjs(s);
    try {
        let r = await rmis.employee();
        r = await r.getEmployeeSpecialities({ employee: id });
        return r;
    } catch (e) { return e; };
};

/**
 * Запрашивает и возвращает информацию о физическом лице
 * по идентификатору физического лица
 * @param {object} s - конфигурация
 * @param {string} id - идентификатор физического лица
 * @return {object}
 */
exports.getIndividual = async (s, id) => {
    const rmis = rmisjs(s);
    try {
        let r = await rmis.individual();
        r = await r.getIndividual(id);
        r = (r) ? r : null;
        return r;
    } catch (e) { return e; };
};


/**
 * Запрашивает и возвращает информацию о документе по идентификатору
 * @param {object} s - конфигурация
 * @param {number} id - идентификатор документа
 * @return {object}
 */
exports.getDocument = async (s, id) => {
    const rmis = rmisjs(s);
    try {
        let r = await rmis.individual();
        r = await r.getDocument(id);
        r = (r) ? r : null;
        return r;
    } catch (e) { return e; };
};

/**
 * Запрашивает и возвращает список идентификаторов документов
 * по идентификатору физического лица
 * @param {object} s - конфигурация
 * @param {string} id - идентификатор физического лица
 * @return {object}
 */
exports.getIndividualDocuments = async (s, id) => {
    const rmis = rmisjs(s);
    try {
        let r = await rmis.individual();
        r = await r.getIndividualDocuments(id);
        r = (r) ? r.document : null;
        return r;
    } catch (e) { return e; };
};

/**
 * Формирует и возвращает список дат на 14 дней вперед
 * в формате YYYY-MM-DD
 * @return {array}
 */
exports.createDates = () => {
    let dates = [];
    for (let i = 0; i < 14; i++) {
        let d = moment().add(i, 'd');
        if (d.isoWeekday() !== 6 && d.isoWeekday() !== 7) {
            dates.push(d.format('YYYY-MM-DD'));
        }
    }
    return dates;
};

/**
 * Форматирует время
 * @param {string} t - время
 * @return {string}
 */
exports.timeFormat = t => moment(t).format('HH:mm:ss');

/**
 * Форматирует дату
 * @param {string} t - дата
 * @return {string}
 */
exports.dateFormat = t => moment(t).format('YYYY-MM-DD');

/**
 * Форматирует дату
 * @param {string} t - дата
 * @return {string}
 */
exports.isoTimeFormat = t => moment(t).format();

/**
 * Проверяет равна ли длина строки 11 символам
 * после удаления всех символов '-' и ' '
 * @param {string} s
 * @return {boolean}
 */
exports.isSnils = s => (s.replace(/-/g, '').replace(/ /g, '').length === 11) ? true : false;

/**
 * Убирает из строки все символы '-' и ' '
 * @param {string} s
 * @return {string}
 */
exports.snils = s => s.replace(/-/g, '').replace(/ /g, '');

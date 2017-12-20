const moment = require('moment');
const rmisjs = require('../../index');

/**
 * Получение сведений об услуге
 * @param {Object} s - конфигурация
 * @param {Number} serviceId - ID услуги в РМИС
 * @return {Promise<Object>} - сведения об услуге
 */
exports.getService = async(s, serviceId) => {
    try {
        const services = await rmisjs(s).rmis.services();
        let data = await services.getService({
            serviceId
        });
        return data.service;
    } catch (e) {
        console.error(e);
        return e;
    }
};

/**
 * Получение списка услуг
 * @param {Object} s - конфигурация
 * @return {Promise<Object>} - список услуг
 */
exports.getServices = async(s) => {
    const services = await rmisjs(s).rmis.services();
    let data = await services.getServices({
        clinic: s.rmis.clinicId
    });
    return data.services;
};

/**
 * Создание талона по данным пациента
 * @param {object} s - конфигурация
 * @param {object} d - данные пациента
 * @return {object}
 */
exports.postReserve = async(s, d) => {
    try {
        let r = await rmisjs(s).rmis.appointment();
        r = await r.postReserve(d);
        r = (r) ? r.slot : null;
        return r;
    } catch (e) {
        console.error(e);
        return e;
    };
};

/**
 * Получение списка записей по данным пациента
 * @param {object} s - конфигурация
 * @param {object} d - данные пациента
 * @return {object}
 */
exports.getReserve = async(s, d) => {
    try {
        let r = await rmisjs(s).rmis.appointment();
        r = await r.getReserve(d);
        r = (r) ? r.slot : null;
        return r;
    } catch (e) {
        console.error(e);
        return e;
    };
};

/**
 * Получение информации талона по id
 * @param {object} s - конфигурация
 * @param {object} d - объект слота
 * @return {object}
 */
exports.getSlot = async(s, d) => {
    try {
        let r = await rmisjs(s).causermis.appointment();
        r = await r.getSlot(d);
        // r = (r) ? r.slot : null;
        return r;
    } catch (e) {
        console.error(e);
        return e;
    };
};

/**
 * Освобождение талона по отказу пациента
 * @param {object} s - конфигурация
 * @param {object} d - id слота
 * @return {object}
 */
exports.deleteSlotByRefusal = async(s, d) => {
    try {
        let r = await rmis.appointment();
        r = await r.deleteSlot({
            slot: d,
            cause: 0
        });
        return r;
    } catch (e) {
        console.error(e);
        return r;
    }
};

/**
 * Создание записи пациента по номеру физлица
 * @param {object} s - конфигурация
 * @param {object} d - данные пациента
 * @return {object}
 */
exports.createPatient = async(s, d) => {
    try {
        let r = await rmisjs(s).rmis.patient();
        r = await r.createPatient(d);
        // r = (r) ? r.note : null;
        return r;
    } catch (e) {
        console.error(e);
        return e;
    };
};

/**
 * Получение пациента по номеру физлица
 * @param {object} s - конфигурация
 * @param {object} id - идентификатор физического лица
 * @return {object}
 */
exports.getPatient = async(s, id) => {
    try {
        let r = await rmisjs(s).rmis.patient();
        r = await r.getPatient(id);
        // r = (r) ? r.note : null;
        return r;
    } catch (e) {
        console.error(e);
        return e;
    };
};

/**
 * Получение информации о прикреплениях пациента
 * @param {object} s - конфигурация
 * @param {object} id - идентификатор физического лица
 * @return {object}
 */
exports.getPatientRegs = async(s, id) => {
    try {
        let r = await rmisjs(s).rmis.patient();
        r = await r.getPatientRegs(id);
        r = (r) ? r.registration : null;
        return r;
    } catch (e) {
        console.error(e);
        return e;
    };
};

/**
 * Получение информации о прикреплении пациента
 * @param {object} s - конфигурация
 * @param {object} id - идентификатор прикрепления
 * @return {object}
 */
exports.getPatientReg = async(s, id) => {
    try {
        let r = await rmisjs(s).rmis.patient();
        r = await r.getPatientReg(id);
        return r;
    } catch (e) {
        console.error(e);
        return e;
    };
};

/**
 * Поиск физического лица по параметрам
 * @param {object} s - конфигурация
 * @param {object} params - параметры поиска
 * @return {object}
 */
exports.searchIndividual = async(s, params) => {
    try {
        let r = await rmisjs(s).rmis.individual();
        r = await r.searchIndividual(params);
        r = (r) ? r.individual : null;
        return r;
    } catch (e) {
        console.error(e);
        return e;
    };
};

/**
 * Запрашивает подразделение по идентификатору
 * @param {object} s - конфигурация
 * @param {number} id - идентификатор подразделения
 * @return {object}
 */
exports.getDepartment = async(s, id) => {
    try {
        let r = await rmisjs(s).rmis.department();
        r = await r.getDepartment({
            departmentId: id
        });
        r = (r) ? r.department : null;
        return r;
    } catch (e) {
        console.error(e);
        return e;
    };
};

/**
 * Запрашивает и возвращает список подразделений
 * @param {object} s - конфигурация
 * @return {object}
 */
exports.getDepartments = async s => {
    try {
        let r = await rmisjs(s).rmis.department();
        r = await r.getDepartments({
            clinic: s.rmis.clinicId
        });
        return r;
    } catch (e) {
        console.error(e);
        return e;
    };
};

/**
 * Запрашивает и возвращает справочник по коду и версии
 * @param {object} s - конфигурация
 * @param {object} id - объект с кодом и версией справочника
 * @return {object}
 */
exports.getRefbook = async(s, id) => {
    try {
        let r = await rmisjs(s).rmis.refbook();
        r = await r.getRefbook({
            refbookCode: id.code,
            version: id.version
        });
        return r;
    } catch (e) {
        console.error(e);
        return e;
    };
};

/**
 * Запрашивает и возвращает список справочников
 * @param {object} s - конфигурация
 * @return {object}
 */
exports.getRefbookList = async s => {
    try {
        let r = await rmisjs(s).rmis.refbook();
        r = await r.getRefbookList();
        return r;
    } catch (e) {
        console.error(e);
        return e;
    };
};

/**
 * Запрашивает и возвращает список версий справочника по коду
 * @param {object} s - конфигурация
 * @param {string} id - код справочника
 * @return {object}
 */
exports.getVersionList = async(s, id) => {
    try {
        let r = await rmisjs(s).rmis.refbook();
        r = await r.getVersionList({
            refbookCode: id
        });
        r = (r) ? r.version : null;
        return r;
    } catch (e) {
        console.error(e);
        return e;
    };
};

/**
 * Запрашивает и возвращает ресурс по идентификатору
 * @param {object} s - конфигурация
 * @param {string} id - идентификатор ресурса
 * @return {object}
 */
exports.getLocation = async(s, id) => {
    try {
        let r = await rmisjs(s).rmis.resource();
        r = await r.getLocation({
            location: id
        });
        r = (r) ? r.location : null;
        return r;
    } catch (e) {
        console.error(e);
        return e;
    };
};

/**
 * Запрашивает и возвращает список идентификаторов ресурсов
 * @param {object} s - конфигурация
 * @return {object}
 */
exports.getLocations = async s => {
    try {
        let r = await rmisjs(s).rmis.resource();
        r = await r.getLocations({
            clinic: s.rmis.clinicId
        });
        return r;
    } catch (e) {
        return e;
    }
};

/**
 * Запрашивает и возвращает список идентификаторов ресурсов
 * @param {object} s - конфигурация
 * @param {object} d - параметры запроса
 * @return {object}
 */
exports.getLocationsWithOptions = async(s, d) => {
    try {
        let r = await rmisjs(s).rmis.resource();
        r = await r.getLocations(d);
        return r;
    } catch (e) {
        return e;
    }
};

/**
 * Запрашивает и возвращает список таймслотов для расписания
 * по идентификатору ресурса и дате расписания
 * @param {object} s - конфигурация
 * @param {string} id - идентификатор ресурса
 * @param {date} date - дата расписания
 * @return {object}
 */
exports.getTimes = async(s, id, date) => {
    try {
        let r = await rmisjs(s).rmis.appointment();
        r = await r.getTimes({
            location: id,
            date: date
        });
        r = (r) ? r.interval : null;
        return r;
    } catch (e) {
        return e;
    }
};

exports.getReserveFiltered = async(s, date, location) => {
    try {
        let r = await rmisjs(s).rmis.appointment();
        r = await r.getReserveFiltered({
            date,
            organization: s.rmis.clinicId,
            location
        });
        r = (r) ? r.slot : null;
        return r;
    } catch (e) {
        return e;
    }
};

/**
 * Запрашивает и возвращает кабинет приема по идентификатору
 * @param {object} s - конфигурация
 * @param {number} id - идентификатор кабинета приема
 * @return {object}
 */
exports.getRoom = async(s, id) => {
    try {
        let r = await rmisjs(s).rmis.room();
        r = await r.getRoom({
            roomId: id
        });
        r = (r) ? r.room : null;
        return r;
    } catch (e) {
        console.error(e);
        return e;
    };
};

/**
 * Запрашивает и возвращает список идентификаторов кабинетов приема
 * @param {object} s - конфигурация
 * @return {object}
 */
exports.getRooms = async s => {
    try {
        let r = await rmisjs(s).rmis.room();
        r = await r.getRooms({
            clinic: s.rmis.clinicId
        });
        return r;
    } catch (e) {
        return e;
    }
};

/**
 * Запрашивает и возвращает сотрудника по идентификатору
 * @param {object} s - конфигурация
 * @param {number} id - идентификатор сотрудника
 * @return {object}
 */
exports.getEmployee = async(s, id) => {
    try {
        let r = await rmisjs(s).rmis.employee();
        r = await r.getEmployee({
            id: id
        });
        r = (r) ? r.employee : null;
        return r;
    } catch (e) {
        console.error(e);
        return e;
    };
};

/**
 * Запрашивает и возвращает список идентификаторов сотрудников
 * @param {object} s - конфигурация
 * @return {object}
 */
exports.getEmployees = async s => {
    try {
        let r = await rmisjs(s).rmis.employee();
        r = await r.getEmployees({
            organization: s.rmis.clinicId
        });
        return r;
    } catch (e) {
        return e;
    }
};

/**
 * Запрышивает и возвращает сведения о должности
 * @param {Object} s - конфигурация
 * @param {Number} id - идентификатор должности
 * @return {Object} - сведения о должности
 */
exports.getPosition = async(s, id) => {
    try {
        let r = await rmisjs(s).rmis.employee();
        r = await r.getPosition({
            id
        });
        r = (r) ? r.position : null;
        return r;
    } catch (e) {
        return e;
    }
};

/**
 * Запрашивает и возвращает должность сотрудника по идентификатору должности
 * @param {object} s - конфигурация
 * @param {number} id - идентификатор должности сотрудника
 * @return {object}
 */
exports.getEmployeePosition = async(s, id) => {
    try {
        let r = await rmisjs(s).rmis.employee();
        r = await r.getEmployeePosition({
            id: id
        });
        r = (r) ? r.employeePosition : null;
        return r;
    } catch (e) {
        console.error(e);
        return e;
    };
};

/**
 * Запрашивает и возвращает список идентификаторов должностей сотрудника
 * по идентификатору сотрудника
 * @param {object} s - конфигурация
 * @param {number} id - идентификатор сотрудника
 * @return {object}
 */
exports.getEmployeePositions = async(s, id) => {
    try {
        let r = await rmisjs(s).rmis.employee();
        r = await r.getEmployeePositions({
            employee: id
        });
        return r;
    } catch (e) {
        console.error(e);
        return e;
    };
};

/**
 * Запрашивает и возвращает список идентификаторов специальностей сотрудника
 * по идентификатору сотрудника
 * @param {object} s - конфигурация
 * @param {number} id - идентификатор сотрудника
 * @return {object}
 */
exports.getEmployeeSpecialities = async(s, id) => {
    try {
        let r = await rmisjs(s).rmis.employee();
        r = await r.getEmployeeSpecialities({
            employee: id
        });
        return r;
    } catch (e) {
        console.error(e);
        return e;
    };
};

/**
 * Запрашивает и возвращает информацию о физическом лице
 * по идентификатору физического лица
 * @param {object} s - конфигурация
 * @param {string} id - идентификатор физического лица
 * @return {object}
 */
exports.getIndividual = async(s, id) => {
    try {
        let r = await rmisjs(s).rmis.individual();
        r = await r.getIndividual(id);
        r = (r) ? r : null;
        return r;
    } catch (e) {
        console.error(e);
        return e;
    };
};


/**
 * Запрашивает и возвращает информацию о документе по идентификатору
 * @param {object} s - конфигурация
 * @param {number} id - идентификатор документа
 * @return {object}
 */
exports.getDocument = async(s, id) => {
    try {
        let r = await rmisjs(s).rmis.individual();
        r = await r.getDocument(id);
        r = (r) ? r : null;
        return r;
    } catch (e) {
        console.error(e);
        return e;
    };
};

/**
 * Запрашивает и возвращает список идентификаторов документов
 * по идентификатору физического лица
 * @param {object} s - конфигурация
 * @param {string} id - идентификатор физического лица
 * @return {object}
 */
exports.getIndividualDocuments = async(s, id) => {
    try {
        let r = await rmisjs(s).rmis.individual();
        r = await r.getIndividualDocuments(id);
        r = (r) ? r.document : null;
        return r;
    } catch (e) {
        console.error(e);
        return e;
    };
};

/**
 * Формирует и возвращает список дат в формате YYYY-MM-DD
 * @param {number} from
 * @param {number} to
 * @return {array}
 */
exports.createDates = (from = 0, to = 14) => {
    let dates = [];
    for (let i = from; i < to; i++) {
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

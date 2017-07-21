const moment = require('moment');
const getLoc = async (s, id) => {
    const rmisjs = require('../../index')(s);
    const rmis = rmisjs.rmis;
    try {
        let r = await rmis.resource();
        r = await r.getLocation({ location: id });
        r = (r) ? r.location : null;
        return r;
    } catch (e) { return e; };
};
const getLocs = async s => {
    const rmisjs = require('../../index')(s);
    const rmis = rmisjs.rmis;
    try {
        let r = await rmis.resource();
        r = await r.getLocations({ clinic: s.rmis.clinicId });
        return r;
    } catch (e) { return e; }
};
const getTimes = async (s, id, date) => {
    const rmisjs = require('../../index')(s);
    const rmis = rmisjs.rmis;
    try {
        let r = await rmis.appointment();
        r = await r.getTimes({ location: id, date: date });
        r = (r) ? r.interval : null;
        return r;
    } catch (e) { return e; }
};
const getRoom = async (s, id) => {
    const rmisjs = require('../../index')(s);
    const rmis = rmisjs.rmis;
    try {
        let r = await rmis.room();
        r = await r.getRoom({ roomId: id });
        r = (r) ? r.room : null;
        return r;
    } catch (e) { return e; };
};
const createDates = () => {
    let dates = [];
    for (let i = 0; i < 7; i++) {
        let d = moment().add(i, 'd');
        if (d.isoWeekday() !== 6 && d.isoWeekday() !== 7) {
            dates.push(d.format('YYYY-MM-DD'));
        }
    }
    return dates;
};
exports.getLocationsWithPortal = s => {
    return new Promise(async (resolve, reject) => {
        try {
            /** Получаем все ресурсы */
            let r = await getLocs(s);
            let result = [];
            /** По каждому id ресурса получаем детализацию ресурса */
            await r.location.reduce((p, c) => p.then(async () => {
                let k = await getLoc(s, c);
                result.push(Object.assign(k, { location: c }));
                return c;
            }), Promise.resolve());
            /** Фильтр на доступные источники ставим на PORTAL и чистим ненужные свойства */
            r = result.filter(i => !!i)
                .filter(i => i.source && i.source.indexOf('PORTAL') !== -1)
                .filter(i => {
                    delete i.service;
                    delete i.equipmentUnitList;
                    delete i.bedList;
                    delete i.organization;
                    delete i.source;
                    delete i.beginDate;
                    delete i.endDate;
                    delete i.system;
                    return i
                });
            /** Запрашиваем расписание на 7 дней вперед без выходных */
            await r.reduce((p, c) => p.then(async () => {
                let rr = [];
                for (let date of createDates()) {
                    let k = await getTimes(s, c.location, date);
                    if (k && k.timePeriod) {
                        k.date = date;
                        rr.push(k);
                    }
                }
                if (rr.length === 0) { rr = null; }
                Object.assign(c, { interval: rr });
                return c;
            }), Promise.resolve());
            /** Чистим то, что не нужно */
            r = r.filter(i => !!i.interval);
            r.forEach(i => {
                i.interval.forEach(j => {
                    j.timePeriod = j.timePeriod.filter(k => !k.notAvailableSources);
                    j.timePeriod.forEach(k => {
                        delete k.availableServices;
                        delete k.notAvailableSources;
                    });
                });
                i.interval = i.interval.filter(j => j.timePeriod.length > 0);
            });
            r = r.filter(i => i.interval.length > 0);
            resolve(r);
        } catch (e) { reject(e); }
    });
};
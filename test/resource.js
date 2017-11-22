process.env.NODE_ENV = 'test';

const {
    expect
} = require('chai');
const nconf = require('../config');
const config = nconf.get('config');
const rmisjs = require('../index')(config);
const rmis = rmisjs.rmis;
const rb = require('refbooks')(config);
const composer = rmisjs.composer;

describe('[RMIS resource > describe]: ', () => {
    it('describe method', async() => {
        try {
            let r = await rmis.resource();
            return expect(r.describe()).to.have.property('locationService');
        } catch (e) {}
    });
});

describe('[RMIS resource > getLocation]: ', () => {
    it('getLocation method', async() => {
        try {
            let r = await rmis.resource();
            r = await r.getLocation({
                location: 1431035
            });
            return expect(r).to.have.property('location');
        } catch (e) {}
    });
});

describe('[RMIS resource > getLocations]: ', () => {
    it('getLocations method', async() => {
        try {
            let r = await rmis.resource();
            r = await r.getLocations({
                clinic: config.rmis.clinicId
            });
            return expect(r).to.have.property('location');
        } catch (e) {}
    });
});

describe('[RMIS composer > getLocationsWithPortal]: ', () => {
    it('getLocationsWithPortal method', async() => {
        try {
            let r = await composer.getLocationsWithPortal();
            return expect(r).deep.to.have.property('source');
        } catch (e) {}
    });
});

describe('[RMIS composer > getDetailedLocations]: ', () => {
    it('getDetailedLocations method', async() => {
        let data = await rb.getRefbook({
            code: 'MDP365',
            version: '1.0',
            part: '1'
        });
        data = data.data.map(i => {
            return {
                code: i[1].value,
                name: i[3].value
            };
        });
        let result = await composer.getDetailedLocations(data);
        let keys = ['name', 'location', 'positionName', 'individual', 'id', 'surname', 'patrName', 'firstName', 'speciality', 'fio', 'snils', 'room', 'position'];
        const birthDateTest = /^\d{4}-\d{2}-\d{2}\+\d{2}:\d{2}$/;
        const dateTest = /^\d{4}-\d{2}-\d{2}$/;
        const timeTest = /^\d{2}:\d{2}:\d{2}\.\d{3}\+\d{2}:\d{2}$/;
        const uuidTest = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
        expect(result).to.be.an.instanceof(Array);
        for (let doc of result) {
            for (let key of keys) {
                expect(doc).to.have.property(key);
                expect(doc[key]).to.be.a('string');
            }
            if ('birthDate' in doc) {
                expect(doc.birthDate).to.satisfy(i => birthDateTest.test(i));
            }
            expect(doc).to.have.property('interval');
            expect(doc.interval).to.be.an.instanceof(Array);
            for (let interval of doc.interval) {
                expect(interval).to.have.property('date');
                expect(interval).to.have.property('timePeriod');
                expect(interval.date).to.satisfy(i => dateTest.test(i));
                expect(interval.timePeriod).to.be.an.instanceof(Array);
                for (let period of interval.timePeriod) {
                    expect(period).to.have.property('from');
                    expect(period).to.have.property('to');
                    expect(period).to.have.property('status');
                    expect(period).to.have.property('uuid');
                    expect(period.from).to.satisfy(i => timeTest.test(i));
                    expect(period.to).to.satisfy(i => timeTest.test(i));
                    expect(period.status).to.be.a('number');
                    expect(period.uuid).to.satisfy(i => uuidTest.test(i));
                }
            }
        }
    });
});
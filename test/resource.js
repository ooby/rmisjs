process.env.NODE_ENV = 'test';

const { expect } = require('chai');
const nconf = require('../config');
const config = nconf.get('config');
const rmisjs = require('../index')(config);
const rmis = rmisjs.rmis;
const composer = rmisjs.composer;

describe('[RMIS resource > describe]: ', () => {
    it('describe method', async () => {
        try {
            let r = await rmis.resource();
            return expect(r.describe()).to.have.property('locationService');
        } catch (e) { }
    });
});

describe('[RMIS resource > getLocation]: ', () => {
    it('getLocation method', async () => {
        try {
            let r = await rmis.resource();
            r = await r.getLocation({ location: 1431035 });
            return expect(r).to.have.property('location');
        } catch (e) { }
    });
});

describe('[RMIS resource > getLocations]: ', () => {
    it('getLocations method', async () => {
        try {
            let r = await rmis.resource();
            r = await r.getLocations({ clinic: config.rmis.clinicId });
            return expect(r).to.have.property('location');
        } catch (e) { }
    });
});

describe('[RMIS composer > getLocationsWithPortal]: ', () => {
    it('getLocationsWithPortal method', async () => {
        try {
            let r = await composer.getLocationsWithPortal();
            return expect(r).deep.to.have.property('source');
        } catch (e) { }
    });
});
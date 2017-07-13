process.env.NODE_ENV = 'test';

const { expect } = require('chai');
const nconf = require('../config');

let app = require('../index.js');

let config = nconf.get('config');

describe('[RMIS resource describe]: ', () => {
    it('describe method', () => {
        return app(config).resource()
            .then(r => {
                return expect(r.describe()).to.have.property('locationService');
            })
            .catch();
    });
});

describe('[RMIS resource getLocations]: ', () => {
    it('getLocations method', () => {
        return app(config).resource()
            .then(r => {
                return r.getLocations({ clinic: config.rmis.clinicId });
            })
            .then(r => {
                return expect(r).to.have.property('location');
            })
            .catch();
    });
});
process.env.NODE_ENV = 'test';

const { expect } = require('chai');
const nconf = require('../config');
const config = nconf.get('config');
const rmisjs = require('../index')(config);
const rmis = rmisjs.rmis;
const rb = require('refbooks')(config);
const composer = rmisjs.composer;
const Ajv = require('ajv');

const detailedLocationSchema = require('./detailedLocation');

describe('[RMIS resource > describe]: ', () => {
    it('describe method', async () => {
        try {
            let r = await rmis.resource();
            return expect(r.describe()).to.have.property('locationService');
        } catch (e) {}
    });
});

describe('[RMIS resource > getLocation]: ', () => {
    it('getLocation method', async () => {
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
    it('getLocations method', async () => {
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
    it('getLocationsWithPortal method', async () => {
        try {
            let r = await composer.getLocationsWithPortal();
            return expect(r).deep.to.have.property('source');
        } catch (e) {}
    });
});

describe('[RMIS composer > getDetailedLocations]: ', () => {
    it('getDetailedLocations method', async () => {
        let [mdp365, c33001] = await Promise.all([
            rb
                .getRefbook({
                    code: 'MDP365',
                    version: '1.0',
                    part: '1'
                })
                .then(r =>
                    r.data.map(i => {
                        return {
                            code: i[1].value,
                            name: i[3].value
                        };
                    })
                ),
            rb
                .getRefbook({
                    code: 'C33001',
                    version: '1.0',
                    part: '1'
                })
                .then(r =>
                    r.data.map(i => {
                        return {
                            code: i[2].value,
                            name: i[3].value
                        };
                    })
                )
        ]);
        let data = await composer.getDetailedLocations(mdp365, c33001);
        let validator = new Ajv();
        let valid = validator.validate(
            {
                type: 'array',
                items: detailedLocationSchema
            },
            data
        );
        if (!valid) {
            console.log(validator.errors);
            throw new Error('Data is not valid');
        }
    });
});

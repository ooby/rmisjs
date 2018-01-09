const config = require('../../config').get('config');
const rmisjs = require('../../index');
const Ajv = require('ajv');

const form025Schema = require('./form025');

const {
    composer
} = rmisjs(config);

describe('EMK', () => {
    describe('Form 025', () =>
        it('Validation', () =>
            composer.get025ByIndividual('W2F2VAYYE1W5CMU9')
            .then(data => {
                let validator = new Ajv();
                let valid = validator.validate({
                    type: 'array',
                    items: form025Schema
                }, data);
                if (!valid) {
                    console.log(validator.errors);
                    throw new Error('Data is not valid');
                }
            })
        )
    );
});

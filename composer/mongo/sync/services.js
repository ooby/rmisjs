const Service = require('../model/service');
const ss = require('string-similarity');
const {
    getService,
    getServices,
} = require('../../libs/collect');

module.exports = async(s) => {
    let services = await getServices(s);
    await Service.remove({
        _id: {
            $nin: services.map(i => i.id)
        }
    });
    let promises = [];
    for (let service of services) {
        service = {
            _id: service.id,
            name: service.name
        };
        service.repeated = /повтор/i.test(service.name);
        let details = await getService(s, service._id);
        if (details.repeated) service.repeated = details.repeated;
        promises.push(
            Service.update({
                _id: service._id
            }, service, {
                upsert: true
            }).exec().catch(e => console.error(e))
        );
    }
    await Promise.all(promises);
};

const connector = require('./connector');

module.exports = async (config, cb) => {
    try {
        await connector.connect(config);
        return await cb();
    } catch (e) {
        console.error(e);
        return e;
    } finally {
        await connector.close();
    }
};

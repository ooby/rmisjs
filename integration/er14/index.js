const { createClient } = require('./client');
const composeLib = async (path, lib) => {
    try {
        let client = await createClient(path);
        return lib(client);
    } catch (e) { return e; }
};
module.exports = s => {
    let path = s.er14.path;
    let refbook = s.er14.refbooks;
    return {
        process: () => composeLib(path, require('./libs/mu'))
    };
};

module.exports = s => {
    return {
        poiskErz: () => require('./libs/poiskErz')(s)
    };
};

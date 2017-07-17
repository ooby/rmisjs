module.exports = config => {
    return {
        rmis: require('./rmisjs')(config),
        composer: require('./composer')(config)
    };
};
module.exports = config => {
  return {
    rmis: require('./rmisjs')(config),
    composer: require('./composer')(config),
    integration: require('./integration')(config)
  }
}

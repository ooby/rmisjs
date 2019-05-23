const soap = require('soap')

module.exports = s => soap.createClientAsync(s.er14.path)

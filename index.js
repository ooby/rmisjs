var async = require('async');
var _ = require('underscore');
var soap = require('soap');
var appointment = require('./lib/appointment');
var department = require('./lib/department');
var employee = require('./lib/employee');
var individual = require('./lib/individual');
var resource = require('./lib/resource');
var room = require('./lib/room');

function url(svc, opt) {
    return _.chain(svc.allowedServices)
        .filter(function (i) { return i.indexOf(opt) !== -1; })
        .map(function (i) { return svc.path + i + '?wsdl'; })
        .value();
};

function createClient(cfg, opt, cb) {
    soap.createClient(url(cfg, opt)[0], function (e, c) {
        if (e) { cb(e); }
        else {
            c.setSecurity(new soap.BasicAuthSecurity(cfg.auth.username, cfg.auth.password));
            cb(null, c);
        }
    });
};

function composeLib(cfg, svc, lib, cb) {
    async.waterfall([
        function (cb) {
            createClient(cfg, svc, cb);
        },
        function (c, cb) {
            cb(null, lib(c));
        }
    ], cb);
};

module.exports = function (config) {
    var cfg = config;
    return {
        appointment: function (cb) { composeLib(cfg, 'appointment', appointment, cb) },
        department: function (cb) { composeLib(cfg, 'department', department, cb) },
        employee: function (cb) { composeLib(cfg, 'employee', employee, cb) },
        individual: function (cb) { composeLib(cfg, 'individual', individual, cb) },
        resource: function (cb) { composeLib(cfg, 'resource', resource, cb) },
        room: function (cb) { composeLib(cfg, 'room', room, cb) }
    };
};
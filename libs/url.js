exports.url = (svc, opt) =>
  svc.allowedServices
    .filter(i => i.indexOf(opt) !== -1)
    .map(i => svc.path + i + '?wsdl')

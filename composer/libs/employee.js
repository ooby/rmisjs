const {
    snils,
    isSnils,
    getDocument,
    getEmployee,
    getEmployees,
    getEmployeePosition,
    getEmployeePositions,
    getEmployeeSpecialities,
    getIndividual,
    getIndividualDocuments
} = require('./collect');
exports.getDetailedEmployees = s => {
    return new Promise(async (resolve, reject) => {
        try {
            let r = await getEmployees(s);
            let result = [];
            await r.employee.reduce((p, c) => p.then(async () => {
                let k = await getEmployee(s, c);
                result.push(Object.assign(k, { id: c }));
                return c;
            }), Promise.resolve());
            r = result.filter(i => !!i).filter(i => !!i.individual);
            result = [];
            await r.reduce((p, c) => p.then(async () => {
                let k = await getIndividual(s, c.individual);
                result.push(Object.assign(c, k));
                return c;
            }), Promise.resolve());
            r = result;
            result = [];
            await r.reduce((p, c) => p.then(async () => {
                let k = await getEmployeeSpecialities(s, c.id);
                result.push(Object.assign(c, k));
                return c;
            }), Promise.resolve());
            r = result;
            result = [];
            await r.reduce((p, c) => p.then(async () => {
                let k = await getIndividualDocuments(s, c.individual);
                if (k) {
                    if (Array.isArray(k.document)) {
                        k.document.forEach(async i => {
                            let rr = await getDocument(s, i);
                            if (isSnils(rr.number)) {
                                result.push(Object.assign(c, { snils: snils(rr.number) }));
                            }
                        });
                    } else {
                        k = await getDocument(s, k.document);
                        if (k.number && isSnils(k.number)) {
                            result.push(Object.assign(c, { snils: snils(k.number) }));
                        }
                    }
                }
                return c;
            }), Promise.resolve());
            r = result;
            result = [];
            await r.reduce((p, c) => p.then(async () => {
                let k = await getEmployeePositions(s, c.id);
                if (k) {
                    if (Array.isArray(k.employeePosition)) {
                        let rr = [];
                        k.employeePosition.forEach(async i => {
                            let j = await getEmployeePosition(s, i);
                            rr.push(j.position);
                        });
                        result.push(Object.assign(c, { position: rr }));
                    } else {
                        k = await getEmployeePosition(s, k.employeePosition);
                        result.push(Object.assign(c, { position: k.position }));
                    }
                }
                return c;
            }), Promise.resolve());
            r = result;
            r = r.filter(i => !!i.speciality).filter(i => !!i.position)
                .filter(i => !!(Array.isArray(i.position) && i.position.length > 0));
            resolve(r);
        } catch (e) { reject(e); }
    });
};

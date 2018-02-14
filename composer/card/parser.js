const XLSX = require('xlsx');

const schema = {
    A: {
        i: 0,
        t: 'n',
        n: 'shelf'
    },
    B: {
        i: 1,
        t: 'n',
        n: 'num'
    },
    C: {
        i: 2,
        t: 's',
        n: 'name'
    },
    D: {
        i: 3,
        t: 'd',
        n: 'birth'
    },
    E: {
        i: 4,
        t: 's',
        n: 'address'
    },
    F: {
        i: 5,
        t: 'd',
        n: 'death'
    }
};
const cols = Object.keys(schema);
const types = Object.values(schema);

const getLine = (sheet, line) => {
    let data = [];
    let nulls = 0;
    for (let col of cols) {
        let name = `${col}${line}`;
        let cell = name in sheet ? sheet[name] : {};
        if (cell.t !== schema[col].t) {
            if (++nulls > 1) return null;
            value = null;
        }
        data.push(cell.v);
    }
    return data;
};

const toCard = line => {
    let data = {};
    for (let type of types) {
        let value = line[type.i];
        if (!value) continue;
        if (type.t === 's') value = value.trim();
        data[type.n] = value;
    }
    let [surname, firstName, patrName] = data.name.split(' ');
    delete data.name;
    Object.assign(data, {
        surname,
        firstName,
        patrName
    });
    return data;
};

const parseXls = data => {
    const workbook = XLSX.read(data, {
        cellDates: true
    });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const range = XLSX.utils.decode_range(sheet['!ref']);
    let result = [];
    for (let i = range.s.r; i <= range.e.r; i++) {
        let data = getLine(sheet, i);
        if (!data) continue;
        let card = toCard(data);
        result.push(card);
    }
    return result;
};

module.exports = parseXls;

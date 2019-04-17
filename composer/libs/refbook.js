const rmisjs = require('../../index');
const Queue = require('../../libs/queue');
const ss = require('string-similarity');

const cache = new Map();
const codes = new Map();

module.exports = async s => {
    const rmis = rmisjs(s);
    const nsi = await rmis.integration.nsi();
    const rmb = await rmis.rmis.refbook();

    const mapRMIS = (data, row) =>
        data[row].map(i =>
            i.column.reduce((p, j) => {
                p[j.name] = j.data;
                return p;
            }, {})
        );

    const findRMIS = async code => {
        if (!code) return null;
        if (/^[\d\.]+$/.test(code)) return code;
        if (codes.has(code)) return codes.get(code);
        try {
            let list = await rmb.getRefbookList();
            let result = mapRMIS(list, 'refbook').find(
                i => i.TABLE_NAME === code
            ).CODE;
            codes.set(code, result);
            return result;
        } catch (e) {
            codes.delete(code);
            return null;
        }
    };

    const mappedNSI = async ({ code, version, indexes }) => {
        let key = JSON.stringify({
            code,
            version,
            indexes
        });
        if (cache.has(key)) return cache.get(key);
        let parts = await nsi.getRefbookParts({ code, version });
        parts = parts || {};
        parts = parts.getRefBookPartsReturn || 0;
        if (!parts) return null;
        let refbook = [];
        for (let i = 1; i <= parts; i++) {
            let r = await nsi.getRefbookPartial({
                code,
                version,
                part: i
            });
            r = r.getRefBookPartialReturn || [];
            for (let item of r) {
                item = item.map.item;
                refbook.push({
                    code: item[indexes[0]].value.$value,
                    name: item[indexes[1]].value.$value
                });
            }
        }
        cache.set(key, refbook);
        return refbook;
    };

    const getCodeNSI = async (name, { code, version, indexes }) => {
        if (!name) return null;
        let dict = await mappedNSI({ code, version, indexes });
        if (!dict) return null;
        let names = dict.map(i => i.name.toUpperCase());
        let index = ss.findBestMatch(name.toUpperCase(), names);
        index = names.indexOf(index.bestMatch.target);
        return dict[index].code;
    };

    const mappedRMIS = async code => {
        code = await findRMIS(code);
        if (!code) return null;
        if (cache.has(code)) return cache.get(code);
        let i = 0;
        let result = [];
        do {
            let data = await rmb.getRefbookPartial({
                refbookCode: code,
                version: 'CURRENT',
                partNumber: ++i
            });
            if (!data) break;
            result = result.concat(mapRMIS(data, 'row'));
        } while (true);
        if (!result.length) return null;
        cache.set(code, result);
        return result;
    };

    const getValueRMIS = async (code, col, val, res) => {
        let refbook = await mappedRMIS(code);
        if (!refbook) return null;
        let row = refbook.find(i => i[col] === val);
        if (!row) return null;
        if (!row[res]) return null;
        return row[res];
    };

    const getRowRMIS = async (code, col, val, res) => {
        code = await findRMIS(code);
        if (!code) return null;
        let data = await rmb.getRefbookRowData({
            refbookCode: code,
            version: 'CURRENT',
            column: {
                name: col,
                data: val
            }
        });
        if (!data) return null;
        data = data || {};
        data = data.row || [];
        data = data[0] || {};
        data = data.column || [];
        for (let col of data) {
            col = col || {};
            if (col.name === res) return col.data;
        }
        return null;
    };

    const clearCache = () => {
        cache.clear();
        codes.clear();
    };

    return {
        mappedNSI,
        findRMIS,
        mappedRMIS,
        getCodeNSI,
        getValueRMIS,
        getRowRMIS,
        clearCache
    };
};

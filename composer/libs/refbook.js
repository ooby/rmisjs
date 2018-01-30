const refbooks = require('refbooks');
const rmisjs = require('../../index');
const Queue = require('../../libs/queue');
const ss = require('string-similarity');

const cache = new Map();
const queue = new Queue(1);

module.exports = async s => {
    const nsi = refbooks(s);
    const rmis = await rmisjs(s).rmis.refbook();

    const mapRMIS = (data, row) =>
        data[row].map(i =>
            i.column.reduce((p, j) => {
                p[j.name] = j.data;
                return p;
            }, {})
        );

    const findRMIS = code =>
        rmis.getRefbookList()
        .then(list =>
            mapRMIS(list, 'refbook')
            .find(i => i.TABLE_NAME === code)
            .CODE
        );

    const mappedNSI = async({ code, version, indexes }) => {
        let key = JSON.stringify({
            code,
            version,
            indexes
        });
        if (cache.has(key)) return cache.get(key);
        let parts = await queue.push(() =>
            nsi.getRefbookParts({
                code,
                version
            })
        );
        if (!parts) return null;
        let refbook = [];
        await Promise.all(
            new Array(parts).fill(0).map((_, i) =>
                queue.push(() =>
                    nsi.getRefbook({
                        code,
                        version,
                        part: i + 1
                    })
                ).then(r => {
                    refbook = refbook.concat(
                        r.data.map(j => {
                            return {
                                code: j[indexes[0]].value,
                                name: j[indexes[1]].value
                            };
                        })
                    );
                })
            )
        );
        cache.set(key, refbook);
        return refbook;
    };

    const getCodeNSI = async(name, { code, version, indexes }) => {
        if (!name) return null;
        let dict = await mappedNSI({ code, version, indexes });
        if (!dict) return null;
        let names = dict.map(i => i.name.toUpperCase());
        let index = ss.findBestMatch(name.toUpperCase(), names);
        index = names.indexOf(index.bestMatch.target);
        return dict[index].code;
    };

    const mappedRMIS = async code => {
        if (/^[a-z_]+$/.test(code)) code = await findRMIS(code);
        if (!/^[\d\.]+$/.test(code)) return null;
        if (cache.has(code)) return cache.get(code);
        let i = 0;
        let result = [];
        do {
            let data = await rmis.getRefbookPartial({
                refbookCode: code,
                version: 'CURRENT',
                partNumber: ++i
            });
            if (!data) break;
            result = result.concat(mapRMIS(data, 'row'));
        } while (true);
        if (!result.length) return null;
        cache.set(cache, result);
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

    const clearCache = () => cache.clear();

    return {
        mappedNSI,
        findRMIS,
        mappedRMIS,
        getCodeNSI,
        getValueRMIS,
        clearCache
    };
};

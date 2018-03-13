const soap = require('soap');
const Queue = require('../libs/queue');
const $ = require('../libs/promisify');

const q = new Queue(1);

module.exports = s =>
    async () => {
        const client = await soap.createClientAsync(s.er14.refbooks, {

        });
        return {
            getRefbookList: d =>
                q.push(() =>
                    client.getRefBookListAsync(d)
                ),
            getRefbookPartial: d =>
                q.push(() =>
                    client.getRefBookPartialAsync(d)
                ),
            getRefbookParts: d =>
                q.push(() =>
                    client.getRefBookPartsAsync(d)
                )
        };
    };
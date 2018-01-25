const request = require('request');

const handleRequest = options =>
    new Promise((resolve, reject) =>
        request(options, (err, res, body) => {
            if (err) return reject(err);
            if (!body) return resolve();
            if (typeof body === 'string') {
                try {
                    body = JSON.parse(body);
                } catch (e) {
                    console.error(body);
                    reject(e);
                }
            }
            if (!body.ErrorCode) return resolve(body);
            if (parseInt(body.ErrorCode) !== 0) {
                return reject({
                    code: body.ErrorCode,
                    text: body.ErrorText,
                    data: options.qs || options.json
                });
            }
            resolve(body);
        })
    );

module.exports = (s, service) => {
    const _base = `${s.emk14.host}/${service}`;
    return {
        get: (action, data) =>
            handleRequest({
                method: 'GET',
                url: `${_base}/${action}`,
                qs: data
            }),

        post: (action, data) =>
            handleRequest({
                method: 'POST',
                url: `${_base}/${action}`,
                json: data
            })
    };
};

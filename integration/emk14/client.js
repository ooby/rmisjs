const request = require('request');

const handleRequest = options =>
    new Promise((resolve, reject) =>
        request(options, (err, res, body) => {
            if (err) return reject(err);
            console.log(options, body);
            if (!body) return resolve();
            if (!body.ErrorCode) return resolve(JSON.parse(body));
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
    const baseUrl = action => `${s.emk14.host}/${service}/${action}`;
    return {
        get: (action, data) =>
            handleRequest({
                method: 'GET',
                url: baseUrl(action),
                qs: data
            }),

        post: (action, data) =>
            handleRequest({
                method: 'POST',
                url: baseUrl(action),
                json: data
            })
    };
};

module.exports = fn =>
    new Promise((resolve, reject) =>
        fn((err, data) => (err ? reject(err) : resolve(data)))
    );

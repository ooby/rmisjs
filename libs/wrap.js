module.exports = (q, cb) => q.push(cb).then(d => d.shift());

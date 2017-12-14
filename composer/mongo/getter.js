module.exports = (obj, def, ...path) => {
    let val = obj;
    for (let part of path) {
        if (val === null) return def;
        if (part in val === false) return def;
        part = val[part];
        if (part === null) return def;
        val = part;
    }
    return val;
};

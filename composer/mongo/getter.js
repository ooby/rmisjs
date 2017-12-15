module.exports = (obj, def, ...path) => {
    try {
        let val = obj;
        for (let part of path) val = val[part];
        return val || def;
    } catch (e) {
        return def;
    }
};

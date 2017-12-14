module.exports = async (fn) => {
    let data = await fn();
    if (data instanceof Error) throw data;
    return data;
};

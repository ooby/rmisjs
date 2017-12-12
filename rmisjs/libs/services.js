module.exports = c => {
    return {
        describe: () => c.describe(),
        getService: d => c.getServiceAsync(d),
        getServices: d => c.getServicesAsync(d)
    };
};

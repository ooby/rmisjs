const sleep = m => new Promise(r => setTimeout(r, m));
const time = () => {
    const [seconds, nanos] = process.hrtime();
    return Math.trunc(seconds * 1000 + nanos / 1000000);
};

module.exports = class TimedQueue {
    constructor(timeout) {
        this.timeout = timeout;
        this.tasks = [];
        this.active = false;
    }

    async probe() {
        if (this.active) return;
        this.active = true;
        while (this.tasks.length) {
            let start = time();
            await (this.tasks.shift())();
            let delta = this.timeout - time() + start;
            if (delta > 0) await sleep(delta);
        }
        this.active = false;
    }

    push(task) {
        return new Promise((resolve, reject) => {
            this.tasks.push(() =>
                task()
                .then(data => resolve(data))
                .catch(e => reject(e))
            );
            this.probe();
        });
    }
};
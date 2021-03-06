module.exports = class Queue {
  constructor(limit = Infinity) {
    this.limit = limit
    this.active = 0
    this.tasks = []
  }

  probe() {
    if (this.active >= this.limit || !this.tasks.length) return
    this.active++
    this.tasks
      .shift()()
      .then(() => {
        this.active--
        return this.probe()
      })
  }

  push(task, array = false) {
    return new Promise((resolve, reject) => {
      this.tasks.push(() =>
        task()
          .then(data => {
            if (array) data = [].concat(data).shift()
            resolve(data)
          })
          .catch(e => reject(e))
      )
      this.probe()
    })
  }
}

const defaultConfig = {
  concurrentTasks: {
    quantity: 3,
    interval: 0
  },
  retries: 0,
};


class Queue {
  config;

  tasks = [];

  promiseCallbacks;

  status = 'stopped';

  lastResolvedTime = 0;

  constructor(data, config) {
    this.config = { ...defaultConfig, ...(config || {}) };

    this.promiseCallbacks = {
      resolve: () => ({}),
      reject: () => ({}),
    };

    this.tasks = data.map(this.createTask);
  }

  enqueue(data) {
    if (this.status === 'finished') throw new Error('Queue already finished');
    this.tasks.push(...data.map(this.createTask));

    return this;
  }

  start(resolver) {
    if (this.status === 'running') throw new Error('Queue already running');

    return new Promise((res, rej) => {
      this.promiseCallbacks.resolve = res;
      this.promiseCallbacks.reject = rej;
      this.loop(resolver);
    });
  }

  loop(resolver) {
    this.status = 'running';
    let runningCount = 0;

    const runTask = () => {
      if (Date.now() < this.lastResolvedTime + this.config.concurrentTasks.interval) {
        return new Promise(resolve => setTimeout(() => resolve(runTask()), this.config.concurrentTasks.interval))
      }


      if (runningCount >= this.config.concurrentTasks.quantity) {
        this.lastResolvedTime = Date.now()
        return
      };

      const task = this.tasks.find(e => e.status === 'waiting');

      if (task) {
        runningCount += 1;
        task.status = 'running';
        task.attempts += 1;

        resolver(task.data)
          .then(() => (task.status = 'finished'))
          .catch(() => {
            task.status =
              task.attempts <= this.config.retries ? 'waiting' : 'failed';
          })
          .finally(() => {
            runningCount -= 1;
            runTask();
          });

        runTask();
        return;
      }

      if (!runningCount) this.finishedQueueProcessing();
    };

    runTask();
  }

  createTask(data) {
    return { attempts: 0, status: 'waiting', data };
  }

  finishedQueueProcessing() {
    this.status = 'finished';

    this.promiseCallbacks.resolve({
      all: this.tasks.map(e => e.data),
      resolved: this.tasks
        .filter(e => e.status === 'finished')
        .map(e => e.data),
      rejected: this.tasks.filter(e => e.status === 'failed').map(e => e.data),
    });
  }
}

module.exports = Queue;

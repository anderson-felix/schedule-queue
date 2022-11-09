const schedule = require('node-schedule');

const FakeConnection = require('./FakeConnection');
const Queue = require('./Queue');

const users = Array.from({ length: 1000 }, (_, i) => ({ id: i + 1, name: `user ${i + 1}` }))

const interval = 1000 * 5; //five seconds
const rule = new schedule.RecurrenceRule();
rule.second = 17;

schedule.scheduleJob(rule, () => {
  const queue = new Queue(users, { concurrentTasks: { quantity: 100, interval } });
  const connection = new FakeConnection();
  queue.start(connection.updateUser);
});

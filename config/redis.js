const Redis = require('ioredis');
const moment = require('moment');
const { REDIS_URI } = require('./vars');
const setLogger = require('./logger');
const Logger = setLogger('App.Config.Redis');

let last = null;

const redisInstance = new Redis(REDIS_URI, {
  // maxRetriesPerRequest: Number.MAX_SAFE_INTEGER,
  maxRetriesPerRequest: 100,
  enableOfflineQueue: false,
  retryStrategy: function (times) {
    if (times < 100) {
      return 200;
    }
  },
});

redisInstance.on('connect', () => {
  console.info('redis connected');
});

redisInstance.on('close', () => {});

redisInstance.on('error', (err) => {
  if (!last) {
    last = moment();
    Logger.error('redis error ' + err);

    return;
  }

  const now = moment();

  const l = moment(last);

  if (now.isAfter(l.add(5, 'minute'))) {
    Logger.error('redis error ' + err);
    last = now;
    return;
  }
});

redisInstance.on('end', function () {
  // Reconnect manually after finished all retry
  redisInstance.connect().catch((e) => {});
});

exports.debug = global.debug || console.log;

module.exports = redisInstance;

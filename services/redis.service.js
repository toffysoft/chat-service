const _ = require('lodash');
const moment = require('moment');

const setLogger = require('../config/logger');
const redis = require('../config/redis');

const Logger = setLogger('services.redis');

const storeQueue = async (queueID, socketId) => {
  await redis.set(`queue:${queueID}`, socketId);
};

const getConnectSocketByQueue = async (queueID) => {
  return redis.get(`queue:${queueID}`);
};
const deleteConnectSocketByQueue = async (queueID) => {
  return redis.del(`queue:${queueID}`);
};

exports.instance = redis;
exports.storeQueue = storeQueue;
exports.getConnectSocketByQueue = getConnectSocketByQueue;
exports.deleteConnectSocketByQueue = deleteConnectSocketByQueue;

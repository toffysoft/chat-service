const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const crypto = require('crypto');
const moment = require('moment');
const RedisService = require('../../services/redis.service');
const errors = require('../../utils/errors');
const setLogger = require('../../config/logger');
const { debug } = require('../../utils');
const LoggerQueue = setLogger('controller.webhook.queue');

exports.queue = async (req, res, next) => {
  const { body } = req;
  try {
    const socketID = await RedisService.getConnectSocketByQueue(body.queueID);

    if (!socketID)
      return next(errors.create(errors.BAD_REQUEST, 'queue id not found'));

    await req.io.of('/').adapter.remoteJoin(socketID, body.userID);

    req.io.to(socketID).emit('join_room', {
      room_id: body.userID,
    });

    return res.json({
      success: true,
      message: 'success',
    });
  } catch (error) {
    LoggerQueue.error(error);
    return next(error);
  }
};

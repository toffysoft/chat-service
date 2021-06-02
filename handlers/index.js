const axios = require('axios');
const _ = require('lodash');
const moment = require('moment');
const RedisService = require('../services/redis.service');
const { isProd } = require('../config/vars');

const setLogger = require('../config/logger');
const { debug } = require('../utils');
const Logger = setLogger('handler.connection');
exports.init = (io, event) => {
  io.on('connection', async (socket) => {
    try {
      console.log(`${moment()} ====>>>> ${socket.id} connected`);

      if (!socket.isAdmin) {
        const res = await axios.post(
          'https://dd57ba0daf63.ngrok.io/api/QueueAPI/createqueue',
          {
            Subject: socket.query.subject,
            Mobile: socket.query.phone,
            ChatID: socket.id,
            ChannelID: 1,
          },
        );

        socket.emit('connected', res.data);

        const adminID = _.get(res.data, ['userID']);
        const queueID = _.get(res.data, ['QueueID']);
        socket.queue = queueID;

        await RedisService.storeQueue(socket.queue, socket.id);
        if (adminID) {
          await io.of('/').adapter.remoteJoin(socket.id, adminID);
          socket.room = adminID;

          socket.emit('join_room', {
            room_id: adminID,
          });
        }
      }

      socket.on('disconnecting', function () {
        event.emit('leave', socket);
      });

      socket.on('disconnect', async function () {
        try {
          await RedisService.deleteConnectSocketByQueue(socket.queue);
          axios
            .get(
              'https://dd57ba0daf63.ngrok.io/api/QueueAPI/endqueue/' +
                socket.queue,
            )
            .then((res) => {
              debug(res.data);
              return res.data;
            })
            .catch((e) => {});
          console.log(`${socket.id} disconnected`);
        } catch (e) {
          Logger.error(error);
        }
      });
    } catch (error) {
      Logger.error(error);
    }
  });
};

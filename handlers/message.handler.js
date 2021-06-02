const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const crypto = require('crypto');
const moment = require('moment');
const Logger = require('../config/logger');
const { JURISTIC_PIC } = require('../config/vars');
const S3 = require('../services/s3.services');
const utils = require('../utils');
const errors = require('../utils/errors');
const validation = require('../validations/message.validation');

const SmartWorldService = require('../services/smartworld.service');
const GroupBanned = require('../models/banned.model');
const APIError = require('../utils/APIError');

module.exports = {
  sendMessage:
    (socket, io, event) =>
    async (data, cb = () => {}) => {
      try {
        await socket.validateSession();
        socket.validateRoom();
        await validation.sendMessageValidate(data);

        if (!socket.Message)
          throw errors.create(null, `[${chatRoom}] is invalid chat_room˝`);

        let banned;

        if (socket.chat_room === 'group' && !socket.user.isJuristic) {
          banned = await GroupBanned.findOne({
            user_id: _.get(socket, ['user', 'id']),
            property_id: socket.property_id,
            start: { $lt: moment() },
            end: { $exists: false },
          });
        }

        // reject intercept
        if (banned) {
          return cb(
            errors.convert(
              errors.create(errors.BAD_REQUEST, {
                en: 'account is banned',
                th: 'บัญชีถูกระงับการใช้งาน',
              }),
            ),
          );
        }

        let read = false;

        if (!banned) {
          const otherUser = await RedisService.getUserChatRoom(socket);

          read = !!_.find(otherUser, (uid) => uid !== socket.user.id);

          if (socket.user.isJuristic && socket.chat_room === 'one' && read) {
            const users = await SmartWorldService.getUsers({
              has_profile_pic: true,
              user_id: otherUser,
            });

            read = !!_.find(
              _.get(users, ['results']),
              (u) => u.id !== socket.user.id && !u.isJuristic,
            );
          }
        }

        if (data.reply) {
          const replyQuery = {
            _id: data.reply,
            property_id: _.get(socket, ['property_id']),
          };

          if (_.get(socket, ['chat_room']) === 'one') {
            _.set(replyQuery, ['user_id'], _.get(socket, ['one_chat_room_id']));
          }

          const replyMessage = await socket.Message.findOne(replyQuery);
          if (!replyMessage)
            return cb(
              errors.convert(
                errors.create(errors.BAD_REQUEST, `reply message id not found`),
              ),
            );
          // if (!!replyMessage.deleted)
          //   return cb(
          //     errors.convert(
          //       errors.create(errors.BAD_REQUEST, `reply message id is deleted`),
          //     ),
          //   );
        }

        const message = new socket.Message({
          property_id: socket.property_id,
          // property_unit_id: socket.property_unit_id,
          message: data.message,
          type: 'text',
          read,
          owner: socket.user.id,
          reply: data.reply,
          status: banned ? 'inactive' : 'active',
        });

        if (socket.chat_room === 'one') {
          message.user_id = socket.one_chat_room_id;
          message.is_juristic = socket.user.isJuristic;
          message.juristic_watched = socket.user.isJuristic;
        } else {
          message.is_juristic =
            socket.user.isJuristic || socket.user.isVirtualJuristic;
          message.juristic_watched =
            socket.user.isJuristic || socket.user.isVirtualJuristic;
        }

        await message.newMessage();
        const m = message.transform({});
        m.owner = socket.getUser();
        m.client_message_id = _.get(data, ['client_message_id'], '');
        // m.watched = true;

        if (_.get(m, ['reply', 'owner'])) {
          if (_.get(m, ['reply', 'is_juristic'])) {
            _.set(m, ['reply', 'owner'], {
              id: _.get(m, ['reply', 'owner']),
              name: { en: 'Juristic', th: 'นิติบุคคล' },
              profilePic: JURISTIC_PIC,
              isJuristic: true,
            });
          } else {
            const users = await SmartWorldService.getUsers({
              has_profile_pic: true,
              user_id: [_.get(m, ['reply', 'owner'])],
            });

            if (_.get(users, ['results', 0, 'id'])) {
              _.set(
                m,
                ['reply', 'owner'],
                socket.getUser(_.get(users, ['results', 0])),
              );
            }
          }
        }

        if (banned) {
          socket.emit('new_message', { chat_room: socket.chat_room, data: m });
        } else {
          event.emit('new_message', socket, m);
        }

        cb();
      } catch (error) {
        if (!(error instanceof APIError)) {
          Logger.error({ context: 'handler/message', error });
        }
        cb(errors.convert(error));
      }
    },

  deleteMessage:
    (socket, io, event) =>
    async (data, cb = () => {}) => {
      try {
        await socket.validateSession();
        socket.validateRoom();
        await validation.deleteMessageValidate(data);

        if (!socket.Message)
          return cb(
            errors.convert(
              errors.create(null, `[${chatRoom}] is invalid chat_room˝`),
            ),
          );

        const query = {
          _id: data.id,
          owner: _.get(socket, ['user', 'id']),
        };

        if (_.get(socket, ['user', 'isJuristic'])) {
          Reflect.deleteProperty(query, 'owner');
        }

        const message = await socket.Message.findOne(query).populate({
          path: 'reply',
          // populate: {
          //   path: 'reply',
          //   populate: {
          //     path: 'reply',
          //   },
          // },
        });
        if (!message)
          return cb(
            errors.convert(
              errors.create(errors.NOT_FOUND, `message not found`),
            ),
          );
        if (message.deleted)
          return cb(
            errors.convert(
              errors.create(errors.BAD_REQUEST, `message is already delete`),
            ),
          );

        let banned;
        if (!_.get(socket, ['user', 'isJuristic'])) {
          banned = await GroupBanned.findOne({
            user_id: _.get(socket, ['user', 'id']),
            property_id: message.property_id,
            start: { $lt: moment() },
            end: { $exists: false },
          });
          if (banned && message.status === 'active')
            return cb(
              errors.convert(
                errors.create(errors.BAD_REQUEST, {
                  en: `could not be delete message during banned`,
                  th: `ไม่สามารถลบข้อความในระหว่างถูกระงับการใช้งานได้`,
                }),
              ),
            );
        }

        message.deleted = moment();
        message.deleted_by = _.get(socket, ['user', 'id']);
        await message.save();
        const m = message.transform({});
        m.deleted_by = socket.getUser();
        if (_.get(socket, ['user', 'isJuristic']) && !m.is_juristic) {
          const users = await SmartWorldService.getUsers({
            has_profile_pic: true,
            user_id: [_.get(m, ['owner'])],
          });

          if (_.get(users, ['results', 0, 'id'])) {
            _.set(m, ['owner'], socket.getUser(_.get(users, ['results', 0])));
          }
        } else {
          m.owner = socket.getUser();
        }
        // m.watched = true;

        if (banned) {
          socket.emit('delete_message', {
            chat_room: socket.chat_room,
            data: m,
          });
        } else {
          event.emit('delete_message', socket, m);
        }

        cb();
      } catch (error) {
        if (!(error instanceof APIError)) {
          Logger.error({ context: 'handler/message', error });
        }
        cb(errors.convert(error));
      }
    },
};

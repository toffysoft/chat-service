const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const crypto = require('crypto');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const Logger = require('../config/logger');
const { JURISTIC_PIC } = require('../config/vars');
const GroupMessage = require('../models/groupMessage.model');
const OneOnOneMessage = require('../models/oneOnOneMessage.model');
const GroupLastJoin = require('../models/groupLastJoin.model');
const OneOnOneLastJoin = require('../models/oneOnOneLastJoin.model');
const SmartWorldService = require('../services/smartworld.service');
const utils = require('../utils');
const errors = require('../utils/errors');
const validation = require('../validations/chat.validation');
const GroupBanned = require('../models/banned.model');
const APIError = require('../utils/APIError');

module.exports = {
  joinChatRoom: (socket, io, event) => async (data, cb = () => {}) => {
    try {
      const sess = await socket.validateSession();
      await socket.validateProperty();
      await validation.selectChatRoomValidate(data);

      const chatroomConfig = await SmartWorldService.getChatroomConfig(
        socket.property_id,
      );

      if (!_.get(chatroomConfig, [data.chat_room])) {
        cb(
          errors.convert(
            errors.create(errors.BAD_REQUEST, {
              en: 'chat_room is not available',
              th: 'ห้องสนทนาอยู่ในสถานะปิดใช้งาน',
            }),
          ),
        );

        let MSG = OneOnOneMessage;

        if (data.chat_room === 'group') {
          MSG = GroupMessage;
        }

        const msg = new MSG({
          created: moment(),
          is_juristic: true,
          message: `ห้องสนทนาอยู่ในสถานะปิดใช้งาน
chat room is not available`,
          owner: uuidv4(),
          property_id: socket.property_id,
          read: true,
          watched: true,
        });

        const m = msg.transform({});

        _.set(m, ['owner'], {
          id: _.get(m, ['owner']),
          name: { en: 'Juristic', th: 'นิติบุคคล' },
          profilePic: JURISTIC_PIC,
          isJuristic: true,
        });

        return socket.emit(`list_message`, {
          chat_room: data.chat_room,
          data: [m],
        });
      }

      if (_.get(socket, ['user', 'isJuristic']) && data.chat_room === 'one') {
        if (!data.user_id) {
          return cb(
            errors.convert(
              errors.create(errors.VALIDATION, {
                en: 'user_id is invalid format *required',
                th: 'ข้อมูล user_id ไม่ถูกต้อง หรือไม่ส่งมา',
              }),
            ),
          );
        }

        if (socket.one_chat_room_id === data.user_id) {
          return cb();
        }
      } else {
        if (socket.chat_room === data.chat_room) {
          return cb();
        }
      }

      if (data.chat_room === 'group' && !socket.user.isJuristic) {
        let banned = await GroupBanned.findOne({
          user_id: _.get(socket, ['user', 'id']),
          property_id: socket.property_id,
          start: { $lt: moment() },
          end: { $exists: false },
        });

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
      }

      if (data.chat_room === 'one') {
        socket.Message = OneOnOneMessage;
        socket.LastJoin = OneOnOneLastJoin;
      } else if (data.chat_room === 'group') {
        socket.Message = GroupMessage;
        socket.LastJoin = GroupLastJoin;
      }

      if (socket.chat_room) {
        if (_.get(socket, ['user', 'isJuristic'])) {
          if (socket.chat_room === 'one') {
            await io.of('/').adapter.remoteLeave(socket.id, socket.getRoomID());
          }
        }

        event.emit('leave_chat_room', socket, {
          chat_room: socket.chat_room,
          chat_room_id: socket.getRoomID(),
          one_chat_room_id: socket.one_chat_room_id,
          property_id: socket.property_id,
          user: socket.getUser(),
        });
      }

      _.set(socket, ['chat_room'], data.chat_room);

      if (_.get(socket, ['user', 'isJuristic'])) {
        _.set(socket, ['one_chat_room_id'], data.user_id);

        if (data.chat_room === 'one') {
          const oneChan = `${data.user_id}-${_.get(socket, ['property_id'])}`;
          await io.of('/').adapter.remoteJoin(socket.id, oneChan);
        }
      } else {
        _.set(socket, ['one_chat_room_id'], _.get(socket, ['user', 'id']));
      }

      cb();

      event.emit('join_chat_room', socket, {
        chat_room: data.chat_room,
        chat_room_id: socket.getRoomID(),
        user: socket.getUser(),
      });
    } catch (error) {
      if (!(error instanceof APIError)) {
        Logger.error({ context: 'handler/join_chat_room', error });
      }

      cb(errors.convert(error));
    }
  },
  leaveChatRoom: (socket, io, event) => async (data, cb = () => {}) => {
    try {
      const sess = await socket.validateSession();
      await socket.validateProperty();

      if (
        _.get(socket, ['user', 'isJuristic']) &&
        _.get(socket, ['chat_room']) === 'one'
      ) {
        await io.of('/').adapter.remoteLeave(socket.id, socket.getRoomID());
      }

      event.emit('leave_chat_room', socket, {
        chat_room: socket.chat_room,
        chat_room_id: socket.getRoomID(),
        one_chat_room_id: socket.one_chat_room_id,
        property_id: socket.property_id,
        user: socket.getUser(),
      });

      _.set(socket, ['chat_room'], undefined);
      _.set(socket, ['one_chat_room_id'], undefined);

      cb();
    } catch (error) {
      if (!(error instanceof APIError)) {
        Logger.error({ context: 'handler/leave_chat_room', error });
      }

      cb(errors.convert(error));
    }
  },
};

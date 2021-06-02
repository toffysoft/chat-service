const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const jimp = require('jimp');
const jo = require('jpeg-autorotate');
const moment = require('moment');
const Logger = require('../config/logger');
const { JURISTIC_PIC } = require('../config/vars');
const S3 = require('../services/s3.services');
const utils = require('../utils');
const errors = require('../utils/errors');
const validation = require('../validations/file.validation');
const RedisService = require('../services/redis.service');
const BaseModel = require('../models/basemodel');
const Magic = require('../utils/mmmagic');
const SmartWorldService = require('../services/smartworld.service');
const GroupBanned = require('../models/banned.model');
const APIError = require('../utils/APIError');
const { default: axios } = require('axios');
const magic = new Magic(Magic.MAGIC_MIME_TYPE);

const LIMIT_SIZE = 100;
const resize = 300;

module.exports = {
  fileBlob:
    (socket, io, event) =>
    async (url, cb = () => {}) => {
      if (!/.(jpg|jpeg|png)/.test(`.${_.toLower(_.last(_.split(url, '.')))}`)) {
        throw 500;
      }
      try {
        await axios({
          url,
          method: 'GET',
          responseType: 'blob', // Important
        })
          .then(async (response) => {
            const name = _.last(_.split(url, '/'));

            const buffer = await axios({
              url,
              method: 'GET',
              responseType: 'arraybuffer', // Important
            })
              .then((response) => {
                return response.data;
              })
              .catch((err) => {
                // throw 500;
              });

            cb({
              data: {
                buffer,
                name,
                type: _.get(response, ['data', 'type']) || 'image/jpeg',
              },
            });
          })
          .catch((err) => {
            cb({ error: err });
          });
      } catch (error) {
        cb({ error });
      }
    },
  uploadFileMessage:
    (socket, io, event) =>
    async (stream, data, cb = () => {}) => {
      let filepath;
      let banned;
      try {
        await socket.validateSession();
        socket.validateRoom();
        await validation.fileMessageValidate(data);

        if (!socket.Message)
          throw errors.create(null, `[${chatRoom}] is invalid chat_room˝`);

        if (socket.chat_room === 'group' && !socket.user.isJuristic) {
          banned = await GroupBanned.findOne({
            user_id: socket.user.id,
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
          //       errors.create(
          //         errors.BAD_REQUEST,
          //         `reply message id is deleted`,
          //       ),
          //     ),
          //   );
        }

        filepath = path.join(__dirname, `../tmp/${_.get(data, ['name'])}`);
        stream.pipe(fs.createWriteStream(filepath));

        stream.on('end', async () => {
          try {
            const mimeType = await magic.detectFile(filepath);
            const type = BaseModel.getMessageFileType(mimeType);
            // console.log('socket receive mimeType', mimeType);

            const fileSize = utils.getFileSize(filepath);

            if (fileSize > LIMIT_SIZE) {
              throw errors.create(errors.BAD_REQUEST, {
                en: `file size [${fileSize}MB] is larger than limit [${LIMIT_SIZE}MB]`,
                th: `ไฟล์มีขนาดใหญ่เกินไป [${fileSize}/${LIMIT_SIZE}]`,
              });
            }

            let thumbnailImage;
            const originalBuffer = fs.readFileSync(filepath);

            try {
              if (type === 'image') {
                if (mimeType === 'image/png') {
                  thumbnailImage = await jimp.read(originalBuffer);
                } else if (
                  mimeType === 'image/jpg' ||
                  mimeType === 'image/jpeg'
                ) {
                  let b;
                  try {
                    const { buffer } = await jo.rotate(originalBuffer, {
                      quality: 60,
                    });
                    b = buffer;
                  } catch (e) {
                    // Logger.error({
                    //   context: 'controller/message_file/rotate',
                    //   error: e,
                    // });
                  }

                  if (!b) b = originalBuffer;

                  thumbnailImage = await jimp.read(b);
                }

                if (thumbnailImage) {
                  const w = thumbnailImage.getWidth();
                  const h = thumbnailImage.getHeight();

                  let isPortrait = h > w;

                  if (isPortrait) {
                    if (h > resize) {
                      await thumbnailImage.resize(jimp.AUTO, resize);
                    } else {
                      thumbnailImage = null;
                    }
                  } else {
                    if (w > resize) {
                      await thumbnailImage.resize(resize, jimp.AUTO);
                    } else {
                      thumbnailImage = null;
                    }
                  }
                }
              }
            } catch (e) {
              Logger.error({
                context: 'controller/message_file/resize',
                error: e,
              });
            }

            const time = moment().format('DDMMYYHHmmssSSS');
            const hash = crypto.randomBytes(8).toString('hex');
            let ext = path.extname(data.name);
            const [dot, key] = _.split(ext, '.');
            const buff = fs.readFileSync(filepath);
            const fileName = `/${socket.user.id}/files/${
              key || 'other'
            }/${time}/${hash /*data.name*/}${ext}`;

            let thumbnailImageResponse;
            try {
              if (thumbnailImage) {
                const thumbnailImageName = `/${socket.user.id}/files/${
                  key || 'other'
                }/${time}/thumbnail-${hash /*data.name*/}${ext}`;

                const thumbnail = await thumbnailImage.getBufferAsync(mimeType);

                thumbnailImageResponse = await S3.upload(
                  thumbnail,
                  thumbnailImageName,
                  'public-read',
                );
              }
            } catch (e) {
              Logger.error({
                context: 'controller/message_file/thumbnail_upload',
                error: e,
              });
            }

            const response = await S3.upload(
              originalBuffer,
              fileName,
              'public-read',
            );

            // let banned;

            // if (socket.chat_room === 'group' && !socket.user.isJuristic) {
            //   banned = await GroupBanned.findOne({
            //     user_id: socket.user.id,
            //     property_id: socket.property_id,
            //     start: { $lt: moment() },
            //     end: { $exists: false },
            //   });
            // }

            // // reject intercept
            // if (banned) {
            //   return cb(
            //     errors.convert(
            //       errors.create(errors.BAD_REQUEST, {
            //         en: 'account is banned',
            //         th: 'บัญชีถูกระงับการใช้งาน',
            //       }),
            //     ),
            //   );
            // }

            let read = false;

            if (!banned) {
              const otherUser = await RedisService.getUserChatRoom(socket);

              read = !!_.find(otherUser, (uid) => uid !== socket.user.id);
            }

            const message = new socket.Message({
              property_id: socket.property_id,
              message: data.message,
              type,
              read,
              url: response.Location,
              owner: socket.user.id,
              reply: data.reply,
              status: banned ? 'inactive' : 'active',
            });

            if (type === 'image') {
              if (thumbnailImageResponse) {
                message.thumbnail_url = thumbnailImageResponse.Location;
              } else {
                message.thumbnail_url = message.url;
              }
            }

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
              socket.emit('new_message', {
                chat_room: socket.chat_room,
                data: m,
              });
            } else {
              event.emit('new_message', socket, m);
            }

            cb();
          } catch (error) {
            Logger.error({ context: 'handler/message_file/stream_end', error });
            cb(errors.convert(error));
          } finally {
            try {
              fs.unlinkSync(filepath);
            } catch (e) {
              Logger.error({
                context: 'handler/message_file/stream_end/clear_temp',
                error: e,
              });
            }
          }
        });
      } catch (error) {
        if (!(error instanceof APIError)) {
          Logger.error({ context: 'handler/message_file', error });
        }
        cb(errors.convert(error));
        if (filepath) {
          try {
            fs.unlinkSync(filepath);
          } catch (e) {
            Logger.error({
              context: 'handler/message_file/clear_temp',
              error: e,
            });
          }
        }
      }
    },
};

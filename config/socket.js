const redisAdapter = require('socket.io-redis');
const _ = require('lodash');
const { SOCKET_REDIS } = require('./vars');
const setLogger = require('./logger');
const Logger = setLogger('App.Config.Socket');

exports.init = (httpServer) => {
  const io = require('socket.io')(httpServer, {
    // path: '/screen',
    // origins: '*:*',
    cors: {
      origin: '*',
      // origin: [new RegExp(`\\.${DOMAIN_NAME}$`), /^http?:\/\/localhost/],
      // methods: ['GET', 'POST'],
      // allowedHeaders: ['screen-id', 'Authorization'],
      credentials: true,
    },
    transports: ['websocket'],
  });

  const adapter = redisAdapter(SOCKET_REDIS);

  io.adapter(adapter);

  io.of('/').adapter.on('error', (err) => {
    Logger.error(err);
  });

  return io;
};

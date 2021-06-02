const _ = require('lodash');

const app = require('../../config/express');
const db = require('../../config/db');
const redis = require('../../config/redis');
const socket = require('../../config/socket');
const event = require('../../config/event');
const config = require('../../config/vars');
const utils = require('../../utils');
const error = require('../../middlewares/error');
const socketMiddlewares = require('../../middlewares/socket');
// const subscribers = require('../../subscribers');
const handlers = require('../../handlers');
const httpServer = require('http').Server(app);
const routes = require('./routes');

global.debug = utils.debug;

const { port, env, MONGODB_HOST } = config;

async function main() {
  try {
    // open mongoose connection
    await db.connect();

    const io = socket.init(httpServer);
    socketMiddlewares.init(io, event);
    // subscribers.init(io, event);
    handlers.init(io, event);

    // mount api routes
    app.use(
      '/api',
      (req, res, next) => {
        req.io = io;
        req.event = event;
        next();
      },
      routes,
    );

    // if error is not an instanceOf APIError, convert it.
    app.use(error.converter);

    // catch 404 and forward to error handler
    app.use(error.notFound);

    // error handler, send stacktrace only during development
    app.use(error.handler);

    const server = httpServer.listen(port, async () => {
      await redis.flushdb();
      console.info(`HTTP  Server running on port ${port} (${env})`);
      console.info(`Database Connection (${MONGODB_HOST})`);
    });

    app.on('error', (e) => {
      console.log({ e });
    });

    return server;
  } catch (e) {
    console.log({ e });

    process.exit(1);
  }
}

module.exports = main();

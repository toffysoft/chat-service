const _ = require('lodash');
const config = require('../config/vars');
const setLogger = require('../config/logger');

const Logger = setLogger('middleware.socket.handle_jwt');
const errors = require('../utils/errors');

const axios = require('axios');

/* ------------------ Auth ------------------ */
exports.init = (io, event) => {
  io.use(async (socket, next) => {
    try {
      const query = _.get(socket, ['handshake', 'query']);

      if (query.admin_id) socket.isAdmin = true;

      socket.query = query;
      return next();
    } catch (error) {
      Logger.error(error);
      return next(error);
    }
  });
};
/* ---------------- End Auth ---------------- */

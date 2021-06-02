const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const crypto = require('crypto');
const moment = require('moment');
const setLogger = require('../config/logger');

const utils = require('../utils');
const errors = require('../utils/errors');

const Logger = setLogger('subscriber.session');

module.exports = {
  leave: (io, event) => async (socket) => {
    try {
      // await io.of('/').adapter.remoteDisconnect(socket.id, true);
      // console.log(`${moment()} session ${socket.id} has leave`);
      console.log('session has leaved');
    } catch (error) {
      Logger.error(error);
    }
  },
  join: (io, event) => async (socket) => {
    try {
      console.log('new session has joined');
    } catch (error) {
      Logger.error(error);
    }
  },
};

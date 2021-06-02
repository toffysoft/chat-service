const _ = require('lodash');
const ms = require('ms');
const fs = require('fs');

const chalk = require('chalk');

exports.minutesDuration = (time /* 09:00 */) => {
  const splitTime = _.split(time, ':');
  const hours = _.get(splitTime, 0);
  const minutes = _.get(splitTime, 1);
  return _.toSafeInteger(hours) * 60 + _.toSafeInteger(minutes);
};

exports.asyncForEach = async function (array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

exports.getIP = (req) => {
  if (!req) return null;
  return (
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress
  ).split(',')[0];
};

exports.isEmail = (email) => {
  let format = /^[a-zA-Z0-9\-_]+(\.[a-zA-Z0-9\-_]+)*@[a-z0-9]+(\-[a-z0-9]+)*(\.[a-z0-9]+(\-[a-z0-9]+)*)*\.[a-z]{2,10}$/;
  return format.test(email);
};

exports.isPhoneNumber = (phoneNumber) => {
  let format = /0[0-9]{9}/;
  return format.test(phoneNumber);
};

exports.toCamel = (obj) => {
  const camelObj = {};

  for (let key in obj) {
    if (typeof obj[key] === 'object' && !_.isArray(obj[key])) {
      camelObj[_.camelCase(key)] = toCamel(obj[key]);
    } else {
      camelObj[_.camelCase(key)] = obj[key];
    }
  }
  return camelObj;
};

exports.toSnake = (obj) => {
  const camelObj = {};

  for (let key in obj) {
    if (typeof obj[key] === 'object' && !_.isArray(obj[key])) {
      camelObj[_.snakeCase(key)] = toSnake(obj[key]);
    } else {
      camelObj[_.snakeCase(key)] = obj[key];
    }
  }
  return camelObj;
};

exports.required = (text = 'params') => {
  throw new Error(`${text} is required`);
};

exports.isPinOrOtp = /^[0-9]{6}$/;

exports.dateFormat = 'YYYY-MM-DD';

exports.parseDesc = (val) => (val === 'true' || val === true ? -1 : 1);

exports.isValidAvailableDate = /(\d{4})-(((0)[0-9])|((1)[0-2]))-([0-2][0-9]|(3)[0-1])$/;

exports.isBranchCode = /^[A-Z]{3}[0-9]{3}$/;

exports.isEndpointsPath = /\/(\w+)/i;

exports.isUsername = /^[A-Z]{2}[0-9]{5}$/;
const isUUIDV4 = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
exports.isUUIDV4 = isUUIDV4;
exports.checkUUID = (s) => {
  return isUUIDV4.test(s);
};

exports.isEmail = /^[a-zA-Z0-9\-_]+(\.[a-zA-Z0-9\-_]+)*@[a-z0-9]+(\-[a-z0-9]+)*(\.[a-z0-9]+(\-[a-z0-9]+)*)*\.[a-z]{2,10}$/;

exports.isPhoneNumber = /0[0-9]{8,9}$/;

exports.isPassword = /^(?:(?=.*[a-z])(?:(?=.*[A-Z])(?=.*[\d\W])|(?=.*\W)(?=.*\d))|(?=.*\W)(?=.*[A-Z])(?=.*\d)).{8,}/;

exports.isImage = ['.png', '.jpg', '.jpeg', '.PNG', '.JPG', '.JPEG'];

const debug = (data) => {
  console.log(
    chalk.white.bgMagenta(
      '=======================+++++++++++++++++++++++=======================',
    ),
  );
  console.log(data);
  console.log(
    chalk.white.bgMagenta(
      '=======================+++++++++++++++++++++++=======================',
    ),
  );
};

exports.debug = debug;

exports.setConnectionTimeout = (time) => (req, res, next) => {
  res.connection.setTimeout(
    typeof time === 'string' ? ms(time) : Number(time || 5000),
  );

  return next();
};

function isEmptyValues(value) {
  return (
    value === undefined ||
    value === null ||
    value === NaN ||
    (typeof value === 'object' && Object.keys(value).length === 0) ||
    (typeof value === 'string' && value.trim().length() === 0)
  );
}

exports.isEmptyValues = isEmptyValues;

exports.clearTemp = (req) => {
  const filepath = _.get(req, ['file', 'path']);

  if (filepath) {
    try {
      fs.unlinkSync(filepath);
    } catch (e) {}
  }
  // _.forEach(_.get(req, ['files']), (file) => {
  //   _.forEach(file, (f) => {
  //     try {
  //       fs.unlinkSync(f.path);
  //     } catch (e) {}
  //   });
  // });
};
exports.clearTemps = (req) => {
  _.forEach(_.get(req, ['files']), (file) => {
    _.forEach(file, (f) => {
      try {
        fs.unlinkSync(f.path);
      } catch (e) {}
    });
  });
};

function getArgs() {
  const args = {};
  process.argv.slice(2, process.argv.length).forEach((arg) => {
    // long arg
    if (arg.slice(0, 2) === '--') {
      const longArg = arg.split('=');
      const longArgFlag = longArg[0].slice(2, longArg[0].length);
      const longArgValue = longArg.length > 1 ? longArg[1] : true;
      args[longArgFlag] = longArgValue;
    }
    // flags
    else if (arg[0] === '-') {
      const flags = arg.slice(1, arg.length).split('');
      flags.forEach((flag) => {
        args[flag] = true;
      });
    }
  });
  return args;
}

exports.parseRedisUri = function parseRedisUri(uri) {
  const [firstPart, secondPart] = _.split(uri, '@');
  const [protocal, password] = _.split(firstPart, '://:');
  const [host, port] = _.split(secondPart, ':');

  const opts = {
    host: '127.0.0.1',
    port: '6379',
  };

  if (host) opts.host = host;
  if (port) opts.port = port;
  if (password) opts.password = password;

  return opts;
};

function getFileSize(filepath) {
  const stats = fs.statSync(filepath);
  const fileSizeInBytes = stats.size;
  return fileSizeInBytes / (1024 * 1024);
}

exports.getArgs = getArgs;
exports.getFileSize = getFileSize;

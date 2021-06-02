const moment = require('moment-timezone'); //moment-timezone
const { format, transports, Container } = require('winston');
const { combine, label, printf } = format;
const _ = require('lodash');

const myFormat = printf(
  (info) =>
    `${info.timestamp} [${info.level}]: ${info.label} - ${
      info.level === 'error'
        ? `${_.get(info, ['title', 'en'], '')} : ${_.get(
            info,
            ['message', 'en'],
            info.message,
          )}`
        : info.message
    }`,
);
const appendTimestamp = format((info, opts) => {
  if (opts.tz) info.timestamp = moment().tz(opts.tz).format();
  return info;
});

const DailyRotateFile = require('winston-daily-rotate-file');

function setLogger(labelName) {
  const transportsConfig = [
    new DailyRotateFile({
      filename: './logs/app/webserver-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      handleExceptions: true,
      json: false,
      //zippedArchive: true,
      maxSize: '20m',
      maxFiles: '40d',
    }),
    new transports.Console({
      level: 'debug',
      handleExceptions: true,
      json: false,
      colorize: true,
    }),
  ];

  let container = new Container();

  return container.add(labelName, {
    level: 'info',
    format: combine(
      label({ label: labelName }),
      appendTimestamp({ tz: 'Asia/Bangkok' }),
      myFormat,
    ),
    transports: transportsConfig,
  });
}

function setWorkerLogger(labelName) {
  const transportsConfig = [
    new DailyRotateFile({
      filename: './logs/worker/web-worker-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      handleExceptions: true,
      json: false,
      //zippedArchive: true,
      maxSize: '20m',
      maxFiles: '40d',
    }),
    new transports.Console({
      level: 'debug',
      handleExceptions: true,
      json: false,
      colorize: true,
    }),
  ];

  let container = new Container();

  return container.add(labelName, {
    level: 'info',
    format: combine(
      label({ label: labelName }),
      appendTimestamp({ tz: 'Asia/Bangkok' }),
      myFormat,
    ),
    transports: transportsConfig,
  });
}

setLogger.worker = setWorkerLogger;

// exports.setWorkerLogger = setWorkerLogger;
module.exports = setLogger;

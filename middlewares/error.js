const HttpStatus = require('http-status');
const _ = require('lodash');
const APIError = require('../utils/APIError');
const { isProd } = require('../config/vars');
const { clearTemp } = require('../utils');

// Error handler. Send stacktrace only during development
const handler = (err, req, res, next) => {
  clearTemp(req);

  const response = {
    code: err.status,
    title: err.title,
    message: err.message,
    errors: err.errors || [],
    stack: err.stack,
  };

  if (isProd) {
    delete response.stack;
    // delete response.errors;
  }

  res.status(err.status);
  res.json(response);
};
exports.handler = handler;

// If error is not an instanceOf APIError, convert it.
exports.converter = (err, req, res, next) => {
  let convertedError = err;

  if (!(err instanceof APIError)) {
    if (err.name === 'MongoError' && err.code === 11000) {
      const errMsg = _.get(err, 'errmsg', '');
      const [key] = _.split(_.split(errMsg, 'index: ')[1], '_1');
      let [value] = _.split(_.split(errMsg, ' : "')[1], '" }');

      convertedError = new APIError({
        title: { en: 'Duplicate Error', th: 'Duplicate Error' },
        message: `${key} : ${value} already exists`,
        // message: {
        //   en: `${key} : ${value} already exists`,
        //   th: `${key} : ${value} มีการใช้งานแล้ว`,
        // },
        errors: [
          {
            field: `${key}`,
            location: 'body',
            messages: `${value} already exists`,
            // messages: {
            //   en: `${value} already exists`,
            //   th: `${value} มีการใช้งานแล้ว`,
            // },
          },
        ],
        status: HttpStatus.CONFLICT,
        isPublic: true,
        stack: err.stack,
      });

      return handler(convertedError, req, res);
    }

    if (err.name === 'ValidationError') {
      const errName = _.get(err, '_message');

      const error = _.map(_.get(err, 'errors'), (e) => e)[0];

      convertedError = new APIError({
        title: errName,
        message: _.get(error, ['message']),
        errors: _.map(_.get(err, 'errors'), (e) => e),
        status: HttpStatus.BAD_REQUEST,
        isPublic: true,
        stack: err.stack,
      });

      return handler(convertedError, req, res);
    }

    const errMsg = _.get(err, 'message', HttpStatus[err.status]);
    const errName = _.get(err, 'name', HttpStatus[err.status]);

    convertedError = new APIError({
      title: _.get(errName, 'en', errName),
      message: _.get(errMsg, 'en', errMsg),
      // title: {
      //   en: _.get(errName, 'en', errName),
      //   th: _.get(errName, 'th', errName),
      // },
      // message: {
      //   en: _.get(errMsg, 'en', errMsg),
      //   th: _.get(errMsg, 'th', errMsg),
      // },
      status: err.status,
      errors: err.errors,
      stack: err.stack,
    });

    return handler(convertedError, req, res);
  }

  return handler(convertedError, req, res);
};

// Catch 404 and forward to error handler
exports.notFound = (req, res, next) => {
  const err = new APIError({
    title: 'Not Found',
    message: 'No endpoints found',
    // title: { en: 'Not Found', th: 'Not Found' },
    // message: { en: 'No endpoints found', th: 'ไม่พบ endpoints ที่ร้องขอ' },
    status: HttpStatus.NOT_FOUND,
  });
  return handler(err, req, res);
};

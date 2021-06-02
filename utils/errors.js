const HttpStatus = require('http-status');
const _ = require('lodash');
const APIError = require('./APIError');
const { isProd } = require('../config/vars');
const { debug } = require('.');
const UNAUTHORIZED = 'unauthorized';
const FORBIDDEN = 'forbidden';
const NOT_FOUND = 'not found';
const BAD_REQUEST = 'bad request';
const CONFLICT = 'conflict';
const VALIDATION = 'validation error';

const errResponse = (err) => {
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

  return response;
};

const create = (type, message, error) => {
  let msg = null;

  if (message) msg = _.get(message, ['en'], message);
  // msg = {
  //   en: _.get(message, ['en'], message),
  //   th: _.get(message, ['th'], message),
  // };

  switch (type) {
    case UNAUTHORIZED:
      return new APIError({
        title: 'UNAUTHORIZED',
        message: msg || 'unauthorized',
        // title: { en: 'UNAUTHORIZED', th: 'UNAUTHORIZED' },
        // message: msg || {
        //   en: 'unauthorized',
        //   th: 'unauthorized',
        // },
        errors: error,
        status: HttpStatus.UNAUTHORIZED,
      });
    case FORBIDDEN:
      return new APIError({
        title: 'FORBIDDEN',
        message: msg || 'forbidden',
        // title: { en: 'FORBIDDEN', th: 'FORBIDDEN' },
        // message: msg || {
        //   en: 'forbidden',
        //   th: 'forbidden',
        // },
        errors: error,
        status: HttpStatus.FORBIDDEN,
      });
    case NOT_FOUND:
      return new APIError({
        title: 'NOT_FOUND',
        message: msg || 'not found',
        // title: { en: 'NOT_FOUND', th: 'NOT_FOUND' },
        // message: msg || {
        //   en: 'not found',
        //   th: 'not found',
        // },
        errors: error,
        status: HttpStatus.NOT_FOUND,
      });
    case BAD_REQUEST:
      return new APIError({
        title: 'BAD_REQUEST',
        message: msg || BAD_REQUEST,
        // title: { en: 'BAD_REQUEST', th: 'BAD_REQUEST' },
        // message: msg || {
        //   en: BAD_REQUEST,
        //   th: BAD_REQUEST,
        // },
        errors: error,
        status: HttpStatus.BAD_REQUEST,
      });
    case VALIDATION:
      return new APIError({
        title: 'VALIDATION_ERROR',
        message: msg || BAD_REQUEST,
        // title: { en: 'VALIDATION_ERROR', th: 'VALIDATION_ERROR' },
        // message: msg || {
        //   en: VALIDATION,
        //   th: VALIDATION,
        // },
        errors: error,
        status: HttpStatus.BAD_REQUEST,
      });
    case CONFLICT:
      return new APIError({
        title: 'CONFLICT',
        message: msg || 'conflict',
        // title: { en: 'CONFLICT', th: 'CONFLICT' },
        // message: msg || {
        //   en: 'conflict',
        //   th: 'conflict',
        // },
        errors: error,
        status: HttpStatus.CONFLICT,
      });
    default:
      return new APIError({
        title: 'INTERNAL SERVER ERROR',
        message: msg || 'internal server error',
        // title: { en: 'INTERNAL SERVER ERROR', th: 'INTERNAL SERVER ERROR' },
        // message: {
        //   en: 'internal server error',
        //   th: 'internal server error',
        // },
        errors: error,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
  }
};

const convert = (err, req, res, next) => {
  let convertedError = err;

  if (!(err instanceof APIError)) {
    if (err.name === 'MongoError' && err.code === 11000) {
      const errMsg = _.get(err, 'errmsg', '');
      const [key] = _.split(_.split(errMsg, 'index: ')[1], '_1');
      let [value] = _.split(_.split(errMsg, ' : "')[1], '" }');

      convertedError = new APIError({
        title: 'Duplicate Error',
        message: `${key} : ${value} already exists`,
        // title: { en: 'Duplicate Error', th: 'Duplicate Error' },
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

      return errResponse(convertedError);
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

      return errResponse(convertedError);
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

    return errResponse(convertedError);
  }

  return errResponse(convertedError);
};

exports.UNAUTHORIZED = UNAUTHORIZED;
exports.FORBIDDEN = FORBIDDEN;
exports.NOT_FOUND = NOT_FOUND;
exports.BAD_REQUEST = BAD_REQUEST;
exports.CONFLICT = CONFLICT;
exports.VALIDATION = VALIDATION;
exports.create = create;
exports.convert = convert;

const HttpStatus = require('http-status');

/**
 * @extends Error
 */
class ExtendableError extends Error {
  constructor({ message, errors, status, isPublic, stack, title }) {
    super(message);
    this.name = this.constructor.name;
    this.title = title;
    this.message = message;
    this.errors = errors;
    this.status = status;
    this.isPublic = isPublic;
    this.isOperational = true; // This is required since bluebird 4 doesn't append it anymore.
    this.stack = stack;
    Error.captureStackTrace(this, this.constructor.name);
  }
}

/**
 * Class representing an API error.
 * @extends ExtendableError
 */
class APIError extends ExtendableError {
  /**
   * Creates an API error.
   * @param {string} message - Error message.
   * @param {number} status - HTTP status code of error.
   * @param {boolean} isPublic - Whether the message should be visible to user or not.
   */
  constructor({
    title,
    message,
    errors = [],
    stack,
    status = HttpStatus.INTERNAL_SERVER_ERROR,
    isPublic = false,
  }) {
    super({
      title,
      message,
      errors,
      status,
      isPublic,
      stack,
    });
  }
}

module.exports = APIError;

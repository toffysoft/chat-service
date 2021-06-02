const Joi = require('joi');

const errors = require('../utils/errors');

Joi.objectId = require('joi-objectid')(Joi);

module.exports = {
  webhookQueueValidate: async (req, res, next) => {
    try {
      // define the validation schema
      const schema = Joi.object().keys({
        queueID: Joi.number().required(),
        userID: Joi.string().required(),
      });

      await schema.validateAsync(req.body);

      return next();
    } catch (error) {
      next(errors.create(errors.VALIDATION, error.message, error.errors));
    }
  },
};

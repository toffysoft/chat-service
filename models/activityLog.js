const mongoose = require('mongoose');
const qs = require('qs');
const _ = require('lodash');
const moment = require('moment');
const { parseDesc } = require('../utils');

const Schema = mongoose.Schema;

const activityLogSchema = new Schema(
  {
    path: {
      type: String,
    },
    method: {
      type: String,
    },
    context: {
      type: String,
      // set: (v) => qs.stringify(v),
      set: (v) => JSON.stringify(v),
    },
    user: {
      type: String,
    },
    created: {
      type: Date,
      index: true,
    },
  },
  { toJSON: { virtuals: true } },
);

activityLogSchema.pre('save', async function save(next) {
  try {
    if (!this.created) {
      this.created = new Date();
    }

    next();
  } catch (error) {
    next(error);
  }
});

activityLogSchema.method({
  transform({ includes = [] }) {
    const transformed = {};

    const availableOption = [];

    let opts = [];

    _.forEach(includes, (val) => {
      if (_.includes(availableOption, val)) {
        opts = [...opts, val];
      }
    });

    const fields = [
      'id',
      '_id',
      'path',
      'method',
      'context',
      'user',
      'created',
      ...opts,
    ];

    fields.forEach((field) => {
      transformed[field] = _.isNil(this[field]) ? '' : this[field];
    });

    return transformed;
  },
});

activityLogSchema.statics = {
  new(req, ctxKey) {
    let method = _.toUpper(_.get(req, ['method']));
    let ctx = req.body;

    if (method === 'GET') ctx = req.query;
    if (method === 'DELETE') ctx = req.params;

    const l = new ActivityLog();
    l.path = _.get(req, ['originalUrl']);
    l.method = method;
    l.context = ctxKey ? _.get(req, ctxKey) : ctx;
    l.user = _.get(req, ['user', 'm']);
    l.created = new Date();

    return l.save();
  },
  newWebhookLog(req, ctx = {}) {
    let method = _.toUpper(_.get(req, ['method']));
    const l = new ActivityLog();
    l.path = _.get(req, ['_parsedUrl', '_raw']);
    l.method = method;
    l.context = ctx;
    l.user = _.get(req, ['user', 'm']);
    l.created = new Date();

    return l.save();
  },
  list({
    page = 1,
    per_page = 10,
    sort = { key: 'created', desc: true },
    includes = [],
    id,
    path,
    method,
    user,
    start_date,
    end_date,
  }) {
    page = parseInt(page);
    per_page = parseInt(per_page);

    if (!_.isNil(user)) {
      user = new RegExp(user, 'i');
    }

    if (!_.isNil(path)) {
      path = new RegExp(path, 'i');
    }

    if (!_.isNil(method)) {
      method = _.toUpper(method);
    }

    let created = null;

    if (start_date) {
      if (!created) created = {};

      created.$gte = moment(start_date, 'YYYY-MM-DD').startOf('day');
    }

    if (end_date) {
      if (!created) created = {};

      created.$lte = moment(end_date, 'YYYY-MM-DD').endOf('day');
    }

    const options = _.omitBy({ _id: id, path, method, user, created }, _.isNil);

    let sortOption = {};

    if (_.includes(['created'], _.get(sort, 'key'))) {
      sortOption[sort['key']] = parseDesc(sort['desc']);
    }

    let includeOpts = [];

    return this.find({ ...options })
      .skip(per_page * (page - 1))
      .limit(per_page)
      .populate(includeOpts)
      .sort(sortOption)
      .exec();
  },

  totalDataCount({ id, path, method, user, start_date, end_date }) {
    if (!_.isNil(user)) {
      user = new RegExp(user, 'i');
    }

    if (!_.isNil(path)) {
      path = new RegExp(path, 'i');
    }

    if (!_.isNil(method)) {
      method = _.toUpper(method);
    }

    let created = null;

    if (start_date) {
      if (!created) created = {};

      created.$gte = moment(start_date, 'YYYY-MM-DD').startOf('day');
    }

    if (end_date) {
      if (!created) created = {};

      created.$lte = moment(end_date, 'YYYY-MM-DD').endOf('day');
    }

    const options = _.omitBy({ _id: id, path, method, user, created }, _.isNil);

    return this.countDocuments({
      ...options,
    }).exec();
  },
};

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;

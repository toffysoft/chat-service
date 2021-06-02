const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const lastJoinSchema = new Schema(
  {
    user_id: {
      type: String,
      index: true,
      required: true,
    },
    is_admin: {
      type: Boolean,
      index: true,
      default: false,
    },
    join_at: {
      type: Date,
      index: true,
    },
    leave_at: {
      type: Date,
      index: true,
    },
  },
  {
    toJSON: { virtuals: true },
  },
);

const LastJoin = mongoose.model('LastJoin', lastJoinSchema);

module.exports = LastJoin;

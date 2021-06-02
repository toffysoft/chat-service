const mongoose = require("mongoose");
const crypto = require("crypto");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const { v4: uuidv4 } = require("uuid");
const {
  JWT_SECRET,
  JWT_EXPIRATION_MINUTES,
  JWT_ISSUER,
  JWT_BACKOFFICE_AUDIENCE,
  JWT_APP_AUDIENCE,
} = require("../config/vars");
const { encrypt } = require("../utils/encryption");
const { parseDesc, required } = require("../utils");

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    index: true,
  },
  user_id: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  created: {
    type: Date,
    index: true,
  },
  updated: {
    type: Date,
    index: true,
  },
  expireAt: {
    type: Date,
    default: null,
  },
});

const month = new Date(new Date().valueOf() + 1000 * 60 * 60 * 24 * 30); // 1 month from now

// Expire at the time indicated by the expireAt field
refreshTokenSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

refreshTokenSchema.pre("save", async function save(next) {
  try {
    if (!this.created) {
      this.created = new Date();
      this.expireAt = month;
    }

    this.updated = new Date();

    next();
  } catch (error) {
    next(error);
  }
});

refreshTokenSchema.method({
  refresh() {
    const token = crypto.randomBytes(40).toString("hex");
    this.token = token;
    this.expireAt = month;

    return this.save();
  },
  generateAccessToken() {
    const now = moment().unix();
    const payload = {
      iss: JWT_ISSUER,
      sub: encrypt(_.toString(this.user_id)),
      n: encrypt(this.name),
      m: encrypt(this.email),
      aud: JWT_BACKOFFICE_AUDIENCE,
      exp: moment().add(JWT_EXPIRATION_MINUTES, "minutes").unix(),
      nbf: now,
      iat: now,
      jti: uuidv4(),
      // jti: _.toString(this._id),
    };

    return jwt.sign(payload, JWT_SECRET);
  },
});

refreshTokenSchema.statics = {
  dry() {
    const token = crypto.randomBytes(40).toString("hex");
    const user_id = uuidv4();

    const now = moment().unix();

    const payload = {
      iss: JWT_ISSUER,
      sub: encrypt(_.toString(user_id)),
      n: encrypt("Mock User"),
      m: encrypt("Mock User"),
      aud: JWT_BACKOFFICE_AUDIENCE,
      exp: moment().add(JWT_EXPIRATION_MINUTES, "minutes").unix(),
      nbf: now,
      iat: now,
      jti: uuidv4(),
    };

    return {
      access_token: jwt.sign(payload, JWT_SECRET),
      refresh_token: token,
    };
  },
  generate({ id, name, email }) {
    const token = crypto.randomBytes(40).toString("hex");

    const tokenObject = new RefreshToken({
      token,
      user_id: id,
      name,
      email,
    });

    return tokenObject.save();
  },
};

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

module.exports = RefreshToken;

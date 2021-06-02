require("harmony-reflect");
const mmm = require("mmmagic");

const constants = [
  "MAGIC_NONE",
  "MAGIC_DEBUG",
  "MAGIC_SYMLINK",
  "MAGIC_DEVICES",
  "MAGIC_MIME_TYPE",
  "MAGIC_CONTINUE",
  "MAGIC_CHECK",
  "MAGIC_PRESERVE_ATIME",
  "MAGIC_RAW",
  "MAGIC_MIME_ENCODING",
  "MAGIC_MIME",
  "MAGIC_APPLE",
  "MAGIC_NO_CHECK_TAR",
  "MAGIC_NO_CHECK_SOFT",
  "MAGIC_NO_CHECK_APPTYPE",
  "MAGIC_NO_CHECK_ELF",
  "MAGIC_NO_CHECK_TEXT",
  "MAGIC_NO_CHECK_CDF",
  "MAGIC_NO_CHECK_TOKENS",
  "MAGIC_NO_CHECK_ENCODING"
];

class Magic {
  constructor(...args) {
    this.magic = new mmm.Magic(...args);
  }

  detectFile(path) {
    return new Promise((resolve, reject) => {
      this.magic.detectFile(path, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  detect(data) {
    return new Promise((resolve, reject) => {
      this.magic.detect(data, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }
}

module.exports = new Proxy(Magic, {
  get(target, name) {
    if (constants.includes(name) && mmm[name]) {
      return mmm[name];
    }
    return target[name];
  }
});

const _ = require("lodash");

const crypto = require("crypto");

const { PAYLOAD_ENCRYPTION_KEY } = require("../config/vars");

function getSecret(secret) {
  const hash = crypto.createHash("sha256");
  hash.update(secret);

  return hash.digest("hex").substring(0, 32);
}

function encrypt(text) {
  let iv = crypto.randomBytes(16);
  let cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(getSecret(PAYLOAD_ENCRYPTION_KEY)),
    iv
  );
  let encrypted = cipher.update(text);

  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(text) {
  try {
    let [ivString, encryptedString] = _.split(text, ":");
    if (!encryptedString) throw "no encrypted string";

    let textParts = text.split(":");
    let iv = Buffer.from(textParts.shift(), "hex");
    let encryptedText = Buffer.from(textParts.join(":"), "hex");
    let decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(getSecret(PAYLOAD_ENCRYPTION_KEY)),
      iv
    );
    let decrypted = decipher.update(encryptedText);

    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
  } catch (error) {
    return text;
  }
}

exports.encrypt = encrypt;
exports.decrypt = decrypt;

exports.getSecret = getSecret;

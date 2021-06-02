const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const {
  MONGODB_HOST,
  MONGODB_USER,
  MONGODB_PASS,
  isProd,
  IS_DOCUMENTDB,
} = require('./vars');
const { debug } = require('../utils');

const options = {
  user: MONGODB_USER,
  pass: MONGODB_PASS,
  numberOfRetries: Number.MAX_VALUE, // Never stop trying to reconnect
  poolSize: 10, // Maintain up to 10 socket connections
  // If not connected, return errors immediately rather than waiting for reconnect
  bufferMaxEntries: 0,
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
};

if (IS_DOCUMENTDB) {
  options.ssl = true;
  options.sslValidate = false;
  options.sslCA = fs.readFileSync(
    path.join(__dirname, './rds-combined-ca-bundle.pem'),
  );
}

let gracefulShutdown;

if (!isProd) {
  mongoose.set('debug', true);
}

mongoose.connection.on('reconnected', async function () {
  console.info('Mongoose reconnected');
});

mongoose.connection.on('error', async function (err) {
  console.error('Mongoose connection error: ' + err);
});

mongoose.connection.on('disconnected', async function () {
  console.info('Mongoose disconnected');
});

// CAPTURE APP TERMINATION / RESTART EVENTS
// To be called when process is restarted or terminated
gracefulShutdown = function (msg, callback) {
  mongoose.connection.close(async function () {
    console.info('Mongoose disconnected through  ' + msg);

    callback();
  });
};
// For nodemon restarts
process.once('SIGUSR2', function () {
  gracefulShutdown('nodemon restart', function () {
    process.kill(process.pid, 'SIGUSR2');
  });
});
// For app termination
process.on('SIGINT', function () {
  gracefulShutdown('app termination', function () {
    process.exit(0);
  });
});
// For Heroku app termination
process.on('SIGTERM', function () {
  gracefulShutdown('Heroku app termination', function () {
    process.exit(0);
  });
});

exports.connect = async (cb = async () => {}) => {
  try {
    const connection = await mongoose.connect(MONGODB_HOST, options);

    await cb(connection);

    return connection;
  } catch (connectionError) {
    console.error('Error creating a mongoose connection', connectionError);
    if (!isProd) {
      process.kill(process.pid, 'SIGUSR2');
    } else {
      process.exit(0);
    }
  }
};

exports.connection = mongoose.connection;

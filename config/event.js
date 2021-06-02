process.setMaxListeners(0);
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();

module.exports = myEmitter;

const ChatSubscriber = require('./chat.subscriber');
const SessionSubscriber = require('./session.subscriber');
const PropertySubscriber = require('./property.subscriber');
const MessageSubscriber = require('./message.subscriber');
const JuristicSubscriber = require('./juristic.subscriber');
const NotificationSubscriber = require('./notification.subscriber');
const AutoReplySubscriber = require('./autoReply.subscriber');
const LineNotifySubscriber = require('./lineNotify.subscriber');

exports.init = (io, event) => {
  event.on('join', SessionSubscriber.join(io, event));

  event.on('leave', SessionSubscriber.leave(io, event));
};

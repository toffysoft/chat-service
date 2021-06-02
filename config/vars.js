module.exports = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,

  API_KEY: process.env.API_KEY,
  MONGODB_HOST: process.env.MONGODB_HOST,
  MONGODB_USER: process.env.MONGODB_USER,
  MONGODB_PASS: process.env.MONGODB_PASS,
  REDIS_URI: process.env.REDIS_URI,
  SOCKET_REDIS: process.env.SOCKET_REDIS,
  isProd: process.env.NODE_ENV === 'production',
  BASE_URL: process.env.BASE_URL,
  ALLOW_ORIGIN: process.env.ALLOW_ORIGIN || '*',
};

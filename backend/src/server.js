const app = require('./app');
const config = require('./config');
const logger = require('./config/logger');

const server = app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.nodeEnv }, 'IMS Backend listening');
});

module.exports = server;

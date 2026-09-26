/**
 * Barrel export so controllers can `const { User, Job } = require('../models')`.
 * Requiring the models here also guarantees every schema is registered with
 * Mongoose before any `populate()` call runs.
 */
module.exports = {
  User: require('./User'),
  Company: require('./Company'),
  Job: require('./Job'),
  Application: require('./Application'),
};

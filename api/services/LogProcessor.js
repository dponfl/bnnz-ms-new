"use strict";

const Joi = require('@hapi/joi');

const winston = require('winston');
const {Loggly} = require('winston-loggly-bulk');

const logger = winston.createLogger({
  levels: {
    criticalHighest: 0,
    criticalHigh: 1,
    criticalMedium: 2,
    criticalLow: 3,
    error: 4,
    warn: 5,
    debug: 6,
    info: 7,
    silly: 8,
  },
  transports: [
    new Loggly({
      token: process.env.LOGGLY_TOKEN || '',
      subdomain: process.env.LOGGLY_SUBDOMAIN || '',
      tags: [process.env.LOGGLY_TAG || "Winston-NodeJS"],
      stripColors: true,
      json: true
    }),
  ]
});


const schema = Joi.object({
  clientGuid: Joi
    .string()
    .description('client guid')
    .guid(),
  accountGuid: Joi
    .string()
    .description('account guid')
    .guid(),
  requestId: Joi
    .string()
    .description('request guid')
    .guid(),
  childRequestId: Joi
    .string()
    .description('child request guid')
    .guid(),
  errorName: Joi
    .string()
    .description('error name'),
  message: Joi
    .string()
    .description('error message')
    .required(),
  location: Joi
    .string()
    .description('error location'),
  emergencyLevel: Joi
    .string()
    .description('error emergency level')
    .valid(
      sails.config.custom.enums.emergencyLevels.LOW,
      sails.config.custom.enums.emergencyLevels.MEDIUM,
      sails.config.custom.enums.emergencyLevels.HIGH,
      sails.config.custom.enums.emergencyLevels.HIGHEST,
    ),
  payload: Joi
    .any()
    .description('payload'),
  error: Joi
    .any()
    .description('Error instance'),
  useHelpDeskLogger: Joi
    .boolean()
    .description('flag to use HelpDesk to create task')
    .default(true),
});


const moduleName = 'LogProcessor';


module.exports = {

  // TODO: Добавить возможность исключать из текстовых логов (оставляя в лога в ДБ)
  // часть данных передаваемых в omitData

  critical: async function(params) {

    const methodName = 'critical';

    let input;

    try {

      // const inputRaw = schema.validate(params);
      // input = inputRaw.value;

      input = await schema.validateAsync(params);

      input.level = 'critical';

      // if (input.emergencyLevel != null) {
      //   switch (input.emergencyLevel) {
      //     case sails.config.custom.enums.emergencyLevels.LOW:
      //       input.sublevel = 'LOW';
      //       break;
      //     case sails.config.custom.enums.emergencyLevels.MEDIUM:
      //       input.sublevel = 'MEDIUM';
      //       break;
      //     case sails.config.custom.enums.emergencyLevels.HIGH:
      //       input.sublevel = 'HIGH';
      //       break;
      //     case sails.config.custom.enums.emergencyLevels.HIGHEST:
      //       input.sublevel = 'HIGHEST';
      //       break;
      //     default:
      //       input.sublevel = 'LOW';
      //   }
      // } else {
      //   input.sublevel = 'LOW';
      // }

      /**
       * Информирование ответственных людей о возникновении критической ошибки
       */

      // TODO: Добавить вызов сервиса, который будет осуществлять информирование
      // с учётом приоритетности проблемы и ролях (должно быть реализовано через конфиг)

      sails.log.error(input.message, _.omit(input, 'message'));

      if (input.emergencyLevel != null) {
        switch (input.emergencyLevel) {
          case sails.config.custom.enums.emergencyLevels.LOW:
            logger.criticalLow(input.message, _.omit(input, 'message'));
            break;
          case sails.config.custom.enums.emergencyLevels.MEDIUM:
            logger.criticalMedium(input.message, _.omit(input, 'message'));
            break;
          case sails.config.custom.enums.emergencyLevels.HIGH:
            logger.criticalHigh(input.message, _.omit(input, 'message'));
            break;
          case sails.config.custom.enums.emergencyLevels.HIGHEST:
            logger.criticalHighest(input.message, _.omit(input, 'message'));
            break;
          default:
            logger.criticalLow(input.message, _.omit(input, 'message'));
        }
      } else {
        logger.criticalLow(input.message, _.omit(input, 'message'));
      }

      await sails.helpers.storage.errorCreateJoi(_.omit(input, 'useHelpDeskLogger'));

      const createCriticalTaskParams = {
        microService: sails.config.custom.enums.microServiceName,
        message: input.message,
      }

      if (!_.isNil(input.emergencyLevel)) {
        createCriticalTaskParams.emergencyLevel = input.emergencyLevel;
      }

      if (!_.isNil(input.errorName)) {
        createCriticalTaskParams.errorName = input.errorName;
      }

      if (!_.isNil(input.clientGuid)) {
        createCriticalTaskParams.clientGuid = input.clientGuid;
      }

      if (!_.isNil(input.accountGuid)) {
        createCriticalTaskParams.accountGuid = input.accountGuid;
      }

      if (!_.isNil(input.requestId)) {
        createCriticalTaskParams.requestId = input.requestId;
      }

      if (!_.isNil(input.childRequestId)) {
        createCriticalTaskParams.childRequestId = input.childRequestId;
      }

      if (!_.isNil(input.location)) {
        createCriticalTaskParams.location = input.location;
      }

      await sails.helpers.helpDesk.pyrus.createCriticalTask(createCriticalTaskParams);


    } catch (e) {

      const errorMsg = 'General error';

      sails.log.error(`${moduleName}:${methodName}, Error details:
      Platform error message: ${errorMsg}
      Error name: ${e.name || 'no name'}
      Error message: ${e.message || 'no message'}
      Error stack: ${e.stack || ''}`);

    }

  },

  error: async function(params) {

    const methodName = 'error';

    let input;

    try {

      // const inputRaw = schema.validate(params);
      // input = inputRaw.value;

      input = await schema.validateAsync(params);


      input.level = 'error';

      sails.log.error(input.message, _.omit(input, 'message'));
      logger.error(input.message, _.omit(input, 'message'));

      await sails.helpers.storage.errorCreateJoi(_.omit(input, 'useHelpDeskLogger'));

      const createErrorTaskParams = {
        microService: sails.config.custom.enums.microServiceName,
        message: input.message,
      }

      if (!_.isNil(input.errorName)) {
        createErrorTaskParams.errorName = input.errorName;
      }

      if (!_.isNil(input.clientGuid)) {
        createErrorTaskParams.clientGuid = input.clientGuid;
      }

      if (!_.isNil(input.accountGuid)) {
        createErrorTaskParams.accountGuid = input.accountGuid;
      }

      if (!_.isNil(input.requestId)) {
        createErrorTaskParams.requestId = input.requestId;
      }

      if (!_.isNil(input.childRequestId)) {
        createErrorTaskParams.childRequestId = input.childRequestId;
      }

      if (!_.isNil(input.location)) {
        createErrorTaskParams.location = input.location;
      }

      await sails.helpers.helpDesk.pyrus.createErrorTask(createErrorTaskParams);

    } catch (e) {

      const errorMsg = 'General error';

      sails.log.error(`${moduleName}:${methodName}, Error details:
      Platform error message: ${errorMsg}
      Error name: ${e.name || 'no name'}
      Error message: ${e.message || 'no message'}
      Error stack: ${e.stack || ''}`);

    }

  },

  warn: async function(params) {

    const methodName = 'warn';


    let input;

    try {

      // const inputRaw = schema.validate(params);
      // input = inputRaw.value;

      input = await schema.validateAsync(params);

      input.level = 'warn';

      sails.log.warn(input.message, _.omit(input, 'message'));
      logger.warn(input.message, _.omit(input, 'message'));

      await sails.helpers.storage.errorCreateJoi(input);

    } catch (e) {

      const errorMsg = 'General error';

      sails.log.error(`${moduleName}:${methodName}, Error details:
      Platform error message: ${errorMsg}
      Error name: ${e.name || 'no name'}
      Error message: ${e.message || 'no message'}
      Error stack: ${e.stack || ''}`);

    }

  },

  debug: async function(params) {

    const methodName = 'debug';

    let input;

    try {

      // const inputRaw = schema.validate(params);
      // input = inputRaw.value;

      input = await schema.validateAsync(params);

      input.level = 'debug';

      sails.log.debug(input.message, _.omit(input, 'message'));
      logger.debug(input.message, _.omit(input, 'message'));


    } catch (e) {

      const errorMsg = 'General error';

      sails.log.error(`${moduleName}:${methodName}, Error details:
      Platform error message: ${errorMsg}
      Error name: ${e.name || 'no name'}
      Error message: ${e.message || 'no message'}
      Error stack: ${e.stack || ''}`);

    }

  },

  info: async function(params) {

    const methodName = 'info';

    let input;

    try {

      // const inputRaw = schema.validate(params);
      // input = inputRaw.value;

      input = await schema.validateAsync(params);

      input.level = 'info';

      sails.log.info(input.message, _.omit(input, 'message'));
      logger.info(input.message, _.omit(input, 'message'));


    } catch (e) {

      const errorMsg = 'General error';

      sails.log.error(`${moduleName}:${methodName}, Error details:
      Platform error message: ${errorMsg}
      Error name: ${e.name || 'no name'}
      Error message: ${e.message || 'no message'}
      Error stack: ${e.stack || ''}`);

    }

  },

  dbError: async function(params) {

    const methodName = 'dbError';

    let input;

    try {

      // const inputRaw = schema.validate(params);
      // input = inputRaw.value;

      input = await schema.validateAsync(params);

      const err = input.error;
      const location = input.location;

      await LogProcessor.error({
        message: `${sails.config.custom.DB_ERROR_MEDIUM.message}: ${input.message}`,
        // requestId: null,
        // childRequestId: null,
        errorName: sails.config.custom.DB_ERROR_MEDIUM.name,
        emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
        location,
        payload: {
          name: err.name || null,
          message: _.truncate(err.message, {
            length: 500,
            omission: ' [...]',
          }) || null,
          code: err.code || null,
          stack: _.truncate(err.stack, {
            length: 500,
            omission: ' [...]',
          })  || null,
          details: err.details || 'none',
        },
      });

    } catch (e) {

      const errorMsg = 'General error';

      sails.log.error(`${moduleName}:${methodName}, Error details:
      Platform error message: ${errorMsg}
      Error name: ${e.name || 'no name'}
      Error message: ${e.message || 'no message'}
      Error stack: ${e.stack || ''}`);

    }

  },

};

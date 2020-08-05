"use strict";

const Joi = require('@hapi/joi');

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
    .description('error emergency level'),
  payload: Joi
    .any()
    .description('payload'),
});


const moduleName = 'LogProcessor';


module.exports = {

  critical: async function(params) {

    const methodName = 'critical';

    let input;

    try {

      const inputRaw = schema.validate(params);
      input = inputRaw.value;

      input.level = 'critical';

      await sails.helpers.storage.errorCreateJoi(input);

      /**
       * Информирование ответственных людей о возникновении критической ошибки
       */

      // TODO: Добавить вызов сервиса, который будет осуществлять информирование
      // с учётом приоритетности проблемы и ролях (должно быть реализовано через конфиг)

      sails.log.error(input.message, _.omit(input, 'message'));

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

      const inputRaw = schema.validate(params);
      input = inputRaw.value;

      input.level = 'error';

      await sails.helpers.storage.errorCreateJoi(input);

      sails.log.error(input.message, _.omit(input, 'message'));

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

      const inputRaw = schema.validate(params);
      input = inputRaw.value;

      input.level = 'warn';

      await sails.helpers.storage.errorCreateJoi(input);

      sails.log.warn(input.message, _.omit(input, 'message'));

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

      const inputRaw = schema.validate(params);
      input = inputRaw.value;

      input.level = 'debug';

      sails.log.debug(input.message, _.omit(input, 'message'));

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

      const inputRaw = schema.validate(params);
      input = inputRaw.value;

      input.level = 'info';

      sails.log.info(input.message, _.omit(input, 'message'));

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

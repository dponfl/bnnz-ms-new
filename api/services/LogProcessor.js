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
  payload: Joi
    .any()
    .description('payload'),
});


const moduleName = 'LogProcessor';


module.exports = {

  error: async function(params) {

    const methodName = 'error';

    let input;

    try {

      const inputRaw = schema.validate(params);
      input = inputRaw.value;

      input.level = 'error';

      await sails.helpers.storage.errorCreateJoi(input);

      sails.log.error(input.errorMessage, input);

    } catch (e) {

      const errorMsg = 'General error';

      sails.log.error(`${moduleName}:${methodName}, Error details:
      Platform error message: ${errorMsg}
      Error name: ${e.name || 'no name'}
      Error message: ${e.message || 'no message'}
      Error stack: ${e.stack || ''}`);

      // throw {err: {
      //     module: `${moduleName}:${methodName}`,
      //     message: errorMsg,
      //     payload: {
      //       error_name: e.name || 'no name',
      //       error_message: e.message || 'no message',
      //       error_stack: e.stack || {},
      //     },
      //   }
      // };

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

      sails.log.warn(input.errorMessage, input);

    } catch (e) {

      const errorMsg = 'General error';

      sails.log.error(`${moduleName}:${methodName}, Error details:
      Platform error message: ${errorMsg}
      Error name: ${e.name || 'no name'}
      Error message: ${e.message || 'no message'}
      Error stack: ${e.stack || ''}`);

      // throw {err: {
      //     module: `${moduleName}:${methodName}`,
      //     message: errorMsg,
      //     payload: {
      //       error_name: e.name || 'no name',
      //       error_message: e.message || 'no message',
      //       error_stack: e.stack || {},
      //     },
      //   }
      // };

    }

  },

  info: async function(params) {

    const methodName = 'info';

    let input;

    try {

      const inputRaw = schema.validate(params);
      input = inputRaw.value;

      input.level = 'info';

      sails.log.info(input.errorMessage, input);

    } catch (e) {

      const errorMsg = 'General error';

      sails.log.error(`${moduleName}:${methodName}, Error details:
      Platform error message: ${errorMsg}
      Error name: ${e.name || 'no name'}
      Error message: ${e.message || 'no message'}
      Error stack: ${e.stack || ''}`);

      // throw {err: {
      //     module: `${moduleName}:${methodName}`,
      //     message: errorMsg,
      //     payload: {
      //       error_name: e.name || 'no name',
      //       error_message: e.message || 'no message',
      //       error_stack: e.stack || {},
      //     },
      //   }
      // };

    }

  },

};

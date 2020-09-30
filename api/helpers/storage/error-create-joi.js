"use strict";

const Joi = require('@hapi/joi');
const uuid = require('uuid-apikey');

const moduleName = 'storage:error-create-joi';


module.exports = {


  friendlyName: 'storage:error-create-joi',


  description: 'Create error record',


  inputs: {

    params: {
      friendlyName: 'input params',
      description: 'input params',
      type: 'ref',
      required: true,
    },

  },


  exits: {
    success: {
      description: 'All done.',
    },
    err: {
      description: 'Error',
    }
  },


  fn: async function (inputs, exits) {

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
        .description('error location')
        .required(),
      level: Joi
        .string()
        .description('error level')
        .required(),
      emergencyLevel: Joi
        .string()
        .description('error emergency level'),
      payload: Joi
        .any()
        .description('payload'),
      createDbRecord: Joi
        .boolean()
        .description('Flag to create a record to DB'),
    });

    try {

      const input = await schema.validateAsync(inputs.params);

      const uuidApiKey = uuid.create();

      const errorRec = input;
      errorRec.guid = uuidApiKey.uuid;

      if (input.payload != null) {
        if (_.isObject(input.payload)) {
          errorRec.payload = await MessageProcessor.clearStr(JSON.stringify(input.payload));
        } else {
          errorRec.payload = await MessageProcessor.clearStr(input.payload);
        }
      }

      await Errors.create(errorRec);

      return exits.success({
        status: 'ok',
        message: 'Error record created',
        payload: errorRec,
      })

    } catch (e) {

      // const errorLocation = moduleName;
      // const errorMsg = `${moduleName}: General error`;
      //
      // sails.log.error(errorLocation + ', error: ' + errorMsg);
      // sails.log.error(errorLocation + ', error details: ', e);
      //
      // throw {err: {
      //     module: errorLocation,
      //     message: errorMsg,
      //     payload: {
      //       error: e,
      //     },
      //   }
      // };

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
        });
        return exits.success({
          status: 'ok',
          message: `${moduleName} performed`,
          payload: {},
        });
      }

    }

  }

};


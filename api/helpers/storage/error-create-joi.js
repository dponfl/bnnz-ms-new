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
    });

    try {

      const input = await schema.validateAsync(inputs.params);

      const uuidApiKey = uuid.create();

      const errorRec = input;
      errorRec.guid = uuidApiKey.uuid;

      await Errors.create(errorRec);

      return exits.success({
        status: 'ok',
        message: 'Error record created',
        payload: errorRec,
      })

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {
            error: e,
          },
        }
      };

    }

  }

};


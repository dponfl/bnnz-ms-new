"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'storage:performance-create-joi';


module.exports = {


  friendlyName: 'Performance record create',


  description: 'Create performance record',


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
      platform: Joi
        .string()
        .description('platform')
        .required(),
      action: Joi
        .string()
        .description('action')
        .required(),
      api: Joi
        .string()
        .description('api provider')
        .required(),
      requestType: Joi
        .string()
        .description('requestType')
        .required(),
      requestDuration: Joi
        .number()
        .integer()
        .positive()
        .description('requestDuration')
        .required(),
      requestDepth: Joi
        .number()
        .integer()
        .positive()
        .description('requestDepth (valid for some requests)'),
      status: Joi
        .string()
        .description('request status')
        .required(),
      comments: Joi
        .any()
        .description('additional data'),
      clientGuid: Joi
        .string()
        .guid()
        .description('client guid'),
      accountGuid: Joi
        .string()
        .guid()
        .description('account guid'),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      const performanceRec = await Performance
        .create({
          platform: input.platform,
          action: input.action,
          api: input.api,
          requestType: input.requestType,
          requestDuration: input.requestDuration,
          requestDepth: input.requestDepth || null,
          status: input.status,
          clientGuid: input.clientGuid || null,
          accountGuid: input.accountGuid || null,
          comments: input.comments || {},
        })
        .fetch();

      return exits.success({
        status: 'ok',
        message: 'Performance record created',
        payload: performanceRec,
      })

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}, error: Performance record create error`;

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


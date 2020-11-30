"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'push-messages:common:chat-blasts:callback-try-joi';


module.exports = {


  friendlyName: 'push-messages:common:chat-blasts:callback-try-joi',


  description: 'push-messages:common:chat-blasts:callback-try-joi',


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
      client: Joi
        .any()
        .description('Client record')
        .required(),
      chatBlastsPerformanceRec: Joi
        .any()
        .description('chatBlastsPerformance record')
        .required(),
      buttonId: Joi
        .string()
        .description('button id')
        .required(),
    });

    let input;

    let clientGuid;
    let accountGuid;


    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;


      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});

      switch (input.buttonId) {
        case 'BTN01':

          await LogProcessor.info({
            message: 'BTN01 pressed',
            clientGuid,
            accountGuid,
            location: moduleName,
            payload: {},
          });

          break;
        case 'BTN02':

          await LogProcessor.info({
            message: 'BTN02 pressed',
            clientGuid,
            accountGuid,
            location: moduleName,
            payload: {},
          });

          break;
        default:
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Wrong callback button id',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
            payload: {
              buttonId: input.buttonId,
            },
          });
      }

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      })

    } catch (e) {

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
          },
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
          },
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


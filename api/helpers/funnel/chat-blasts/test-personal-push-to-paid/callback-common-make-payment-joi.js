"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'api:helpers:funnel:chat-blasts:test-personal-push-to-paid:callback-common-make-payment-joi';


module.exports = {


  friendlyName: 'api:helpers:funnel:chat-blasts:test-personal-push-to-paid:callback-common-make-payment-joi',


  description: 'api:helpers:funnel:chat-blasts:test-personal-push-to-paid:callback-common-make-payment-joi',


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
      block: Joi
        .any()
        .description('Current funnel block')
        .required(),
      query: Joi
        .any()
        .description('Callback query received')
        .required(),
    });

    let input;

    let clientGuid;
    let accountGuid;

    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      switch (input.query.data) {
        case 'select_another_option':

          const switchChatBlastFunnelToAnyBlockParams = {
            client: input.client,
            chatBlastName: 'pushToPaid',
            chatBlastFunnel: 'funnelOne',
            blockId: 'start',
            skipBlocks: [],
            proceedNextBlock: false,
            createdBy: moduleName,
          };

          await sails.helpers.funnel.switchChatBlastFunnelToAnyBlockJoi(switchChatBlastFunnelToAnyBlockParams);

          break;
        default:
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Wrong callback data',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.FUNNELS_ERROR.name,
            payload: {
              inputQueryData: input.query.data,
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
          clientGuid,
          accountGuid,
          error: e,
          location: moduleName,
          throwError,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          clientGuid,
          accountGuid,
          error: e,
          location: moduleName,
          throwError,
        });
        return exits.success({
          status: 'error',
          message: `${moduleName} not performed`,
          payload: {},
        });
      }

    }

  }

};


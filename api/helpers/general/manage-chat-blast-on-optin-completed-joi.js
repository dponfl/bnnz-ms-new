"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'general:manage-chat-blast-on-optin-completed-joi';


module.exports = {


  friendlyName: 'general:manage-chat-blast-on-optin-completed-joi',


  description: 'general:manage-chat-blast-on-optin-completed-joi',


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
    });

    let input;

    let client;
    let clientGuid;
    let accountGuid;

    const testServiceNames = [
      'test_personal',
      'test_personal_initial',
      // 'test_commercial',
      // 'test_commercial_initial'
    ];


    try {

      input = await schema.validateAsync(inputs.params);

      client = input.client;
      clientGuid = client.guid;
      accountGuid = client.account_use;

      const currentAccount = _.find(client.accounts, {guid: client.account_use});

      if (_.indexOf(testServiceNames, currentAccount.service.name) >= 0) {

        const activateChatBlastParams = {
          client,
          chatBlastName: "pushToPaid",
        };

        const activateChatBlastRaw = await sails.helpers.chatBlastsProcessor.activateChatBlastJoi(activateChatBlastParams);

        if (activateChatBlastRaw.status !== 'success') {
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Chat Blasts activation error',
            clientGuid,
            accountGuid,
            payload: {
              activateChatBlastRaw,
            },
          });
        }
      }

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      })

    } catch (e) {

      const throwError = false;
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


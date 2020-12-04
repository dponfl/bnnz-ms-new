"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'keyboards:silver-personal:home:univer-joi';


module.exports = {


  friendlyName: 'keyboards:silver-personal:home:univer-joi',


  description: 'keyboards:silver-personal:home:univer-joi',


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

    let clientGuid;
    let accountGuid;


    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;


      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});

      currentAccount.keyboard = "univer::start";

      input.client.current_funnel = '';

      await sails.helpers.storage.clientUpdateJoi({
        criteria: {guid: input.client.guid},
        data: input.client,
        createdBy: moduleName,
      });

      const sendKeyboardForAccountParams = {
        client: input.client,
      };

      const sendKeyboardForAccountRaw = await sails.helpers.keyboardProcessor.sendKeyboardForAccountJoi(sendKeyboardForAccountParams);

      if (sendKeyboardForAccountRaw.status !== 'ok') {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Wrong sendKeyboardForAccountJoi response',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.KEYBOARDS_ERROR.name,
          payload: {
            sendKeyboardForAccountParams,
            sendKeyboardForAccountRaw,
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


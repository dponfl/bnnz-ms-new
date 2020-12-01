"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'push-messages:common:chat-blasts:after-try-joi';


module.exports = {


  friendlyName: 'push-messages:common:chat-blasts:after-try-joi',


  description: 'push-messages:common:chat-blasts:after-try-joi',


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
        .required(),
      messageData: Joi
        .any()
        .required(),
      additionalParams: Joi
        .any(),
    });

    let input;

    let clientGuid;
    let accountGuid;

    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      await LogProcessor.info({
        message: 'afterHelper initiated',
        clientGuid,
        accountGuid,
        location: moduleName,
        payload: {},
      });

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
          }
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
          }
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


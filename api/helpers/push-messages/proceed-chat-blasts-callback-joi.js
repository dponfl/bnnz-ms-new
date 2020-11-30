"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'push-messages:proceed-chat-blasts-callback-joi';


module.exports = {


  friendlyName: 'push-messages:proceed-chat-blasts-callback-joi',


  description: 'push-messages:proceed-chat-blasts-callback-joi',


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
      chatBlastsPerformanceRec: Joi
        .any()
        .required(),
      buttonId: Joi
        .string()
        .required(),
    });

    let clientGuid;
    let accountGuid;


    try {

      const input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;


      let splitCallbackHelperRes = _.split(input.messageData.callbackHelper, sails.config.custom.JUNCTION, 3);
      let callbackHelperCategory = splitCallbackHelperRes[0];
      let callbackHelperBlock = splitCallbackHelperRes[1];
      let callbackHelperName = splitCallbackHelperRes[2];

      if (callbackHelperCategory && callbackHelperBlock && callbackHelperName) {

        /**
         * We managed to parse the specified callbackHelper and can perform it
         */

        await sails.helpers.pushMessages[callbackHelperCategory][callbackHelperBlock][callbackHelperName]({
          client: input.client,
          chatBlastsPerformanceRec: input.chatBlastsPerformanceRec,
          buttonId: input.buttonId,
        });

      } else {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'Could not parse callback helper name',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
          payload: {
            inputMessageDataCallbackHelper: input.messageData.callbackHelper,
            callbackHelperCategory,
            callbackHelperBlock,
            callbackHelperName,
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


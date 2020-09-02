"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'push-messages:proceed-push-message-joi';


module.exports = {


  friendlyName: 'push-messages:proceed-push-message-joi',


  description: 'Perform push message block',


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
      client: Joi.any().required(),
      query: Joi.any().required(),
      messageData: Joi.any().required(),
    });

    let clientGuid;
    let accountGuid;


    try {

      const input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;


      let splitCallbackHelperRes = _.split(input.messageData.callbackHelper, sails.config.custom.JUNCTION, 2);
      let callbackHelperCategory = splitCallbackHelperRes[0];
      let callbackHelperBlock = splitCallbackHelperRes[1];
      let callbackHelperName = splitCallbackHelperRes[2];

      if (callbackHelperCategory && callbackHelperBlock && callbackHelperName) {

        /**
         * We managed to parse the specified callbackHelper and can perform it
         */

        // const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});

        // const pushMessageName = currentAccount.service.push_message_name;

        await sails.helpers.pushMessages[callbackHelperCategory][callbackHelperBlock][callbackHelperName]({
          client: input.client,
          query: input.query,
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
            callbackHelperBlock,
            callbackHelperName,
          },
        });
      }

      return exits.success({
        status: 'ok',
        message: 'proceedPushMessageJoi performed',
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


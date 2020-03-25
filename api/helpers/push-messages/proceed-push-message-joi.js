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

    try {

      const input = await schema.validateAsync(inputs.params);

      let splitCallbackHelperRes = _.split(input.messageData.callbackHelper, sails.config.custom.JUNCTION, 2);
      let callbackHelperBlock = splitCallbackHelperRes[0];
      let callbackHelperName = splitCallbackHelperRes[1];

      if (callbackHelperBlock && callbackHelperName) {

        /**
         * We managed to parse the specified callbackHelper and can perform it
         */

        await sails.helpers.pushMessages[callbackHelperBlock][callbackHelperName](input.client, sails.config.custom.pushMessages.tasks.likes.messages[0], input.query);
        // await sails.helpers[callbackHelperBlock][callbackHelperName](input.client, sails.config.custom.pushMessages.tasks.likes.messages[0], input.query);

      } else {
        throw new Error(`${moduleName}, critical error: could not parse callback helper name: 
            callbackHelperBlock: ${callbackHelperBlock}
            callbackHelperName: ${callbackHelperName}`);
      }

      return exits.success({
        status: 'ok',
        message: 'proceedPushMessageJoi performed',
        payload: {},
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


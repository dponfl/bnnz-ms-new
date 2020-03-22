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
      group: Joi.any().required(),
      startBlockName: Joi.string().required(),
    });

    let block = null;

    try {

      const input = await schema.validateAsync(inputs.params);

      block = _.find(input.group, {id: input.startBlockName});

      if (block == null) {
        throw new Error(`${moduleName}, critical error: initial block with id=${input.startBlockName} not found in the group: \n${JSON.stringify(input.group, null, 3)}`);
      }


      /**
       * Сюда нужно добавить проверку наличия и запуск хелперов:
       *    - beforeHelper
       *    - blockModifyHelper
       */



      let splitCallbackHelperRes = _.split(block.callbackHelper, sails.config.custom.JUNCTION, 2);
      let callbackHelperBlock = splitCallbackHelperRes[0];
      let callbackHelperName = splitCallbackHelperRes[1];

      if (callbackHelperBlock && callbackHelperName) {

        /**
         * We managed to parse the specified callbackHelper and can perform it
         */

        await sails.helpers.pushMessages[callbackHelperBlock][callbackHelperName](input.client, sails.config.custom.pushMessages.tasks.likes.messages[0], input.query);

      } else {
        throw new Error(`${moduleName}, critical error: could not parse callback helper name: 
            callbackHelperBlock: ${callbackHelperBlock}
            callbackHelperName: ${callbackHelperName}`);
      }



      /**
       * Сюда нужно добавить проверку наличия и запуск хелперов:
       *    - afterHelper
       */

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


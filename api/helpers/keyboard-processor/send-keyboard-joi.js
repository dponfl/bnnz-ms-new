"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'keyboard-processor:send-keyboard-joi';


module.exports = {


  friendlyName: 'keyboard-processor:send-keyboard-joi',


  description: 'keyboard-processor:send-keyboard-joi',


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

    const schema = Joi
      .object({
        client: Joi
          .any()
          .required(),
        messageData: Joi
          .any()
          .required(),
        keyboardData: Joi
          .any()
          .required(),
        additionalTokens: Joi
          .any(),
        disableWebPagePreview: Joi
          .boolean()
          .description('flag to disable web page preview at message'),
      });

    let input;

    let clientGuid;
    let accountGuid;


    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;


      const html = await KeyboardProcessor.parseMessageStyle({
        client: input.client,
        message: input.messageData,
        additionalTokens: input.additionalTokens,
      });

      const keyboard = await KeyboardProcessor.mapButtonsDeep({
        client: input.client,
        buttons: input.keyboardData,
      });

      const res = await sails.helpers.mgw.telegram.keyboardMessageJoi({
        chatId: input.client.chat_id,
        html,
        keyboard,
      });


      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: res,
      })

    } catch (e) {

      // const errorMsg = 'General error';
      //
      // sails.log.error(`${moduleName}, Error details:
      // Platform error message: ${errorMsg}
      // Error name: ${e.name || 'no name'}
      // Error message: ${e.message || 'no message'}
      // Error stack: ${JSON.stringify(e.stack || {}, null, 3)}`);
      //
      // throw {err: {
      //     module: `${moduleName}`,
      //     message: errorMsg,
      //     payload: {
      //       error_name: e.name || 'no name',
      //       error_message: e.message || 'no message',
      //       error_stack: e.stack || {},
      //     },
      //   }
      // };

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


"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'mgw:telegram:keyboard-remove-joi';

module.exports = {


  friendlyName: 'Remove keyboard',


  description: 'Remove keyboard',


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
    },
  },


  fn: async function (inputs, exits) {

    const schema = Joi.object({
      chatId: Joi
        .string()
        .description('client chat id we use to send message')
        .required(),
      html: Joi
        .string()
        .description('html code of the message')
        .required(),
      disableWebPagePreview: Joi
        .boolean()
        .description('flag to disable web page preview at message'),
    });


    try {

      const input = await schema.validateAsync(inputs.params);

      const disable_web_page_preview = input.disableWebPagePreview || false;

      let sendMessageRes = await sails.config.custom.telegramBot.sendMessage(
        input.chatId,
        input.html,
        {
          parse_mode: 'HTML',
          disable_web_page_preview,
          reply_markup: {
            remove_keyboard: true,
          }
        }
      );

      return exits.success({
        status: 'ok',
        message: 'Telegram keyboard was removed',
        payload: sendMessageRes,
      })

    } catch (e) {

      const errorMsg = `${sails.config.custom.KEYBOARD_REMOVE_SEND_ERROR}`;

      sails.log.error(`${moduleName}, Error details:
      Platform error message: ${errorMsg}
      Error name: ${e.name || 'no name'}
      Error message: ${e.message || 'no message'}
      Error stack: ${JSON.stringify(e.stack || {}, null, 3)}`);

      throw {err: {
          module: `${moduleName}`,
          message: errorMsg,
          payload: {
            error_name: e.name || 'no name',
            error_message: e.message || 'no message',
            error_stack: e.stack || {},
          },
        }
      };

    }

  }

};


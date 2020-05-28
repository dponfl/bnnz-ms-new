"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'mgw:telegram:keyboard-message-joi';

module.exports = {


  friendlyName: 'Keyboard for Telegram',


  description: 'Send keyboard on Telegram messenger',


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
      keyboard: Joi
        .any()
        .description('keyboard of the message')
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
            keyboard: input.keyboard,
          }
        }
      );

      return exits.success({
        status: 'ok',
        message: 'Telegram keyboard message was sent',
        payload: sendMessageRes,
      })

    } catch (e) {


      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: ${sails.config.custom.KEYBOARD_MESSAGE_SEND_ERROR}`;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {
        err: {
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


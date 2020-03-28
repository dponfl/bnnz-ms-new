"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'mgw:telegram:inline-keyboard-message-joi';

module.exports = {


  friendlyName: 'Inline keyboard message Telegram',


  description: 'Send inline keyboard message on Telegram messenger',


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

    // sails.log.info('Telegram inline keyboard message: ', inputs);

    const schema = Joi.object({
      chatId: Joi
        .string()
        .description('client chat id we use to send message')
        .required(),
      html: Joi
        .string()
        .description('html code of the message')
        .required(),
      inlineKeyboard: Joi
        .any()
        .description('inline keyboard of the message')
        .required(),
    });


    try {

      const input = await schema.validateAsync(inputs.params);

      let sendMessageRes = await sails.config.custom.telegramBot.sendMessage(
        input.chatId,
        input.html,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: input.inlineKeyboard,
          }
        }
      );

      return exits.success({
        status: 'ok',
        message: 'Telegram inline keyboard message was sent',
        payload: sendMessageRes,
      })

    } catch (e) {


      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: ${sails.config.custom.INLINE_KEYBOARD_MESSAGE_SEND_ERROR}`;

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


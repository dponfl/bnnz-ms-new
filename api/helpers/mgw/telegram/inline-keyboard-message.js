"use strict";

module.exports = {


  friendlyName: 'Inline keyboard message Telegram',


  description: 'Send inline keyboard message on Telegram messenger',


  inputs: {

    chatId: {
      friendlyName: 'client chatId',
      description: 'client chat id we use to send message',
      type: 'string',
      required: true,
    },

    html: {
      friendlyName: 'html of the message',
      description: 'html code of the message',
      type: 'string',
      required: true,
    },

    inlineKeyboard: {
      friendlyName: 'inline keyboard',
      description: 'inline keyboard of the message',
      type: 'ref',
      required: true,
    }

  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {

    sails.log.info('Telegram inline keyboard message: ', inputs);

    try {

      let sendMessageRes = await sails.config.custom.telegramBot.sendMessage(
        inputs.chatId,
        inputs.html,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: inputs.inlineKeyboard,
          }
        }
      );

      return exits.success({
        status: 'ok',
        message: 'Telegram inline keyboard message was sent',
        payload: sendMessageRes,
      })

    } catch (e) {

      const errorLocation = 'api/helpers/mgw/telegram/inline-buttons-message';
      const errorMsg = sails.config.custom.INLINE_KEYBOARD_MESSAGE_SEND_ERROR;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
        }
      };
    }

  }


};


"use strict";

module.exports = {


  friendlyName: 'Forced message Telegram',


  description: 'Send forced text message on Telegram messenger',


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
    }

  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {

    sails.log.info('Telegram forced message: ', inputs);

    try {

      let sendMessageRes = await sails.config.custom.telegramBot.sendMessage(
        inputs.chatId,
        inputs.html,
        {
          parse_mode: 'HTML',
          reply_markup: {
            force_reply: true
          }
        }
      );

      return exits.success({
        status: 'ok',
        message: 'Telegram simple message was sent',
        payload: sendMessageRes,
      })

    } catch (e) {

      const errorLocation = 'api/helpers/mgw/telegram/forced-message';
      const errorMsg = sails.config.custom.FORCED_MESSAGE_SEND_ERROR;

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

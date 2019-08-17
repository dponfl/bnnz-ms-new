module.exports = {


  friendlyName: 'Keyboard for Telegram',


  description: 'Send keyboard on Telegram messenger',


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

    keyboard: {
      friendlyName: 'keyboard',
      description: 'keyboard of the message',
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

    sails.log.info('Telegram keyboard message: ', inputs);

    try {

      let sendMessageRes = await sails.config.custom.telegramBot.sendMessage(
        inputs.chatId,
        inputs.html,
        {
          reply_markup: {
            keyboard: inputs.keyboard,
          }
        }
      );

      return exits.success({
        status: 'ok',
        message: 'Telegram keyboard message was sent',
        payload: sendMessageRes,
      })

    } catch (e) {

      const errorLocation = 'api/helpers/mgw/telegram/keyboard-message';
      const errorMsg = sails.config.custom.KEYBOARD_MESSAGE_SEND_ERROR;

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


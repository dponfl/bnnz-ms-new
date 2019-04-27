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

      throw {err: {
          module: 'api/helpers/mgw/telegram/keyboard-message',
          message: sails.config.custom.KEYBOARD_MESSAGE_SEND_ERROR,
          payload: {
            params: inputs,
            error: {
              name: e.name || 'no error name',
              message: _.truncate(e.message, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error message',
              stack: _.truncate(e.stack, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error stack',
              code: e.code || 'no error code',
            }
          }
        }
      };

    }

  }


};


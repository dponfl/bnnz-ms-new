module.exports = {


  friendlyName: 'Image message Telegram',


  description: 'Send image message on Telegram messenger',


  inputs: {

    chatId: {
      friendlyName: 'client chatId',
      description: 'client chat id we use to send message',
      type: 'string',
      required: true,
    },

    imgPath: {
      friendlyName: 'image url',
      description: 'image url',
      type: 'string',
      required: true,
    },

    html: {
      friendlyName: 'html of the message',
      description: 'html code of the message',
      type: 'string',
    }

  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {

    sails.log.info('Telegram simple message: ', inputs);

    try {

      let messageObj = {
        parse_mode: 'HTML'
      };

      if (inputs.html) {
        messageObj.caption = inputs.html;
      }

      let sendMessageRes = await sails.config.custom.telegramBot.sendPhoto(
        inputs.chatId,
        inputs.imgPath,
        messageObj
      );

      return exits.success({
        status: 'ok',
        message: 'Telegram img message was sent',
        payload: sendMessageRes,
      })

    } catch (e) {

      throw {err: {
          module: 'api/helpers/mgw/telegram/img-message',
          message: sails.config.custom.IMG_MESSAGE_SEND_ERROR,
          payload: {
            chatId: inputs.chatId,
            imgPath: inputs.imgPath,
            html: inputs.html,
            error: e.message || 'no error message',
          }
        }
      };

    }

  }


};


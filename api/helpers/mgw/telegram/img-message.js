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

    sails.log.info('Telegram img message: ', inputs);

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

      const errorLocation = 'api/helpers/mgw/telegram/img-message';
      const errorMsg = sails.config.custom.IMG_MESSAGE_SEND_ERROR;

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


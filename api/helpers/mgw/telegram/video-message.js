module.exports = {


  friendlyName: 'Video message Telegram',


  description: 'Send video message on Telegram messenger',


  inputs: {

    chatId: {
      friendlyName: 'client chatId',
      description: 'client chat id we use to send message',
      type: 'string',
      required: true,
    },

    videoPath: {
      friendlyName: 'video url',
      description: 'video url',
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

    sails.log.info('Telegram video message: ', inputs);

    try {

      let messageObj = {
        parse_mode: 'HTML'
      };

      if (inputs.html) {
        messageObj.caption = inputs.html;
      }

      let sendMessageRes = await sails.config.custom.telegramBot.sendVideo(
        inputs.chatId,
        inputs.videoPath,
        messageObj
      );

      return exits.success({
        status: 'ok',
        message: 'Telegram video message was sent',
        payload: sendMessageRes,
      })

    } catch (e) {

      const errorLocation = 'api/helpers/mgw/telegram/video-message';
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


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

      throw {err: {
          module: 'api/helpers/mgw/telegram/video-message',
          message: sails.config.custom.IMG_MESSAGE_SEND_ERROR,
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


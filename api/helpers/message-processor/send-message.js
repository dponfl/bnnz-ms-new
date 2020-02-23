"use strict";

const moduleName = 'message-processor:send-message';


module.exports = {


  friendlyName: 'message-processor:send-message',


  description: 'Send message',


  inputs: {

    client: {
      friendlyName: 'Client',
      description: 'Client record',
      type: 'ref',
      required: true,
    },

    messageData: {
      friendlyName: 'message data',
      description: 'message data',
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
    }

  },


  fn: async function (inputs, exits) {

    let sendMessageResult = null;

    try {

      switch (inputs.messageData.actionType) {

        case 'text':

          /**
           * Send simple text message
           */

          const htmlSimple = await sails.helpers.messageProcessor.parseMessageStyle.with({
            client: inputs.client,
            message: inputs.messageData,
          });

          const simpleRes = await sails.helpers.mgw[inputs.client.messenger]['simpleMessage'].with({
            chatId: inputs.client.chat_id,
            html: htmlSimple,
          });

          sendMessageResult = simpleRes;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSave.with({
            message_id: simpleRes.payload.message_id || 0,
            message: htmlSimple,
            message_format: 'push simple',
            messenger: inputs.client.messenger,
            message_originator: 'bot',
            client_id: inputs.client.id,
            client_guid: inputs.client.guid
          });

          break;

        case 'img':

          /**
           * Send img message
           */

          const htmlImg = await sails.helpers.messageProcessor.parseMessageStyle.with({
            client: inputs.client,
            message: inputs.messageData,
          });

          const imgRes = await sails.helpers.mgw[inputs.client.messenger]['imgMessage'].with({
            chatId: inputs.client.chat_id,
            imgPath: sails.config.custom.cloudinaryImgUrl + inputs.messageData.message.img,
            html: htmlImg,
          });

          sendMessageResult = imgRes;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSave.with({
            message_id: imgRes.payload.message_id || 0,
            message: JSON.stringify({
              img: sails.config.custom.cloudinaryImgUrl + inputs.messageData.message.img,
              html: htmlImg,
            }),
            message_format: 'push img',
            messenger: inputs.client.messenger,
            message_originator: 'bot',
            client_id: inputs.client.id,
            client_guid: inputs.client.guid
          });

          break;

        case 'video':

          /**
           * Send video message
           */

          const htmlVideo = await sails.helpers.messageProcessor.parseMessageStyle.with({
            client: inputs.client,
            message: inputs.messageData,
          });

          const videoRes = await sails.helpers.mgw[inputs.client.messenger]['videoMessage'].with({
            chatId: inputs.client.chat_id,
            videoPath: sails.config.custom.cloudinaryVideoUrl + inputs.messageData.message.video,
            html: htmlVideo,
          });

          sendMessageResult = videoRes;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSave.with({
            message_id: videoRes.payload.message_id || 0,
            message: JSON.stringify({
              video: sails.config.custom.cloudinaryVideoUrl + inputs.messageData.message.video,
              html: htmlVideo,
            }),
            message_format: 'push video',
            messenger: inputs.client.messenger,
            message_originator: 'bot',
            client_id: inputs.client.id,
            client_guid: inputs.client.guid
          });

          break;

        case 'forced':

          /**
           * Send forced reply message
           */

          const htmlForced = await sails.helpers.messageProcessor.parseMessageStyle.with({
            client: inputs.client,
            message: inputs.messageData,
          });

          const forcedRes = await sails.helpers.mgw[inputs.client.messenger]['forcedMessage'].with({
            chatId: inputs.client.chat_id,
            html: htmlForced,
          });

          sendMessageResult = forcedRes;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSave.with({
            message_id: forcedRes.payload.message_id || 0,
            message: htmlForced,
            message_format: 'push forced',
            messenger: inputs.client.messenger,
            message_originator: 'bot',
            client_id: inputs.client.id,
            client_guid: inputs.client.guid
          });

          break;

        case 'inline_keyboard':

          /**
           * Send inline keyboard message
           */

          const htmlInline = await sails.helpers.messageProcessor.parseMessageStyle.with({
            client: inputs.client,
            message: inputs.messageData,
          });

          const inlineKeyboard = await sails.helpers.messageProcessor.mapDeep.with({
            client: inputs.client,
            data: htmlInline.inline_keyboard,
          });

          const inlineRes = await sails.helpers.mgw[inputs.client.messenger]['inlineKeyboardMessage'].with({
            chatId: inputs.client.chat_id,
            html: htmlInline,
            inlineKeyboard: inlineKeyboard,
          });

          sendMessageResult = inlineRes;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSave.with({
            message_id: inlineRes.payload.message_id || 0,
            message: htmlInline,
            message_format: 'push callback',
            messenger: inputs.client.messenger,
            message_originator: 'bot',
            client_id: inputs.client.id,
            client_guid: inputs.client.guid,
            message_buttons: inlineKeyboard,
          });

          break;


      }

      return exits.success(sendMessageResult);

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

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


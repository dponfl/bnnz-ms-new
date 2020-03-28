"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'message-processor:send-message-joi';


module.exports = {


  friendlyName: 'message-processor:send-message-joi',


  description: 'Send message',


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
    }

  },


  fn: async function (inputs, exits) {

    const schema = Joi.object({
      client: Joi.any().required(),
      messageData: Joi.any().required(),
      additionalTokens: Joi.any(),
      blockModifyHelperParams: Joi.any(),
      beforeHelperParams: Joi.any(),
      afterHelperParams: Joi.any(),
    });

    let sendMessageResult = null;
    let messageData = null;

    try {

      const input = await schema.validateAsync(inputs.params);

      messageData = input.messageData;

      /**
       * Call blockModifyHelper to update block if needed
       */

      if (messageData.blockModifyHelper != null) {

        let splitBlockModifyHelperRes = _.split(input.messageData.blockModifyHelper, sails.config.custom.JUNCTION, 2);
        let blockModifyHelperBlock = splitBlockModifyHelperRes[0];
        let blockModifyHelperName = splitBlockModifyHelperRes[1];

        if (blockModifyHelperBlock && blockModifyHelperName) {

          const blockModifyHelperParams = {
            client: input.client,
            messageData,
            additionalParams: input.blockModifyHelperParams,
          };

          messageData = await sails.helpers.pushMessages[blockModifyHelperBlock][blockModifyHelperName](blockModifyHelperParams);

        } else {
          throw new Error(`${moduleName}, critical error: could not parse blockModifyHelper: 
            blockModifyHelperBlock: ${blockModifyHelperBlock}
            blockModifyHelperName: ${blockModifyHelperName}`);
        }

      }

      switch (messageData.actionType) {

        case 'text':

          /**
           * Send simple text message
           */

          const htmlSimple = await sails.helpers.messageProcessor.parseMessageStyleJoi({
            client: input.client,
            message: messageData.message,
            additionalTokens: input.additionalTokens,
          });

          /**
           * Call beforeHelper to update block if needed
           */

            // put "beforeHelper" call here...



          const simpleRes = await sails.helpers.mgw[input.client.messenger]['simpleMessageJoi']({
            chatId: input.client.chat_id,
            html: htmlSimple,
          });

          sendMessageResult = simpleRes;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSaveJoi({
            message_id: simpleRes.payload.message_id || 0,
            message: htmlSimple,
            message_format: sails.config.custom.enums.messageFormat.PUSHSIMPLE,
            messenger: input.client.messenger,
            message_originator: sails.config.custom.enums.messageOriginator.BOT,
            client_id: input.client.id,
            client_guid: input.client.guid
          });

          break;

        case 'img':

          /**
           * Send img message
           */

          const htmlImg = await sails.helpers.messageProcessor.parseMessageStyleJoi({
            client: input.client,
            message: input.messageData.message,
            additionalTokens: input.additionalTokens,
          });

          const imgRes = await sails.helpers.mgw[input.client.messenger]['imgMessageJoi']({
            chatId: input.client.chat_id,
            imgPath: sails.config.custom.cloudinaryImgUrl + input.messageData.message.img,
            html: htmlImg,
          });

          sendMessageResult = imgRes;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSaveJoi({
            message_id: imgRes.payload.message_id || 0,
            message: JSON.stringify({
              img: sails.config.custom.cloudinaryImgUrl + input.messageData.message.img,
              html: htmlImg,
            }),
            message_format: sails.config.custom.enums.messageFormat.PUSHIMG,
            messenger: input.client.messenger,
            message_originator: sails.config.custom.enums.messageOriginator.BOT,
            client_id: input.client.id,
            client_guid: input.client.guid
          });

          break;

        case 'video':

          /**
           * Send video message
           */

          const htmlVideo = await sails.helpers.messageProcessor.parseMessageStyleJoi({
            client: input.client,
            message: input.messageData.message,
            additionalTokens: input.additionalTokens,
          });

          const videoRes = await sails.helpers.mgw[input.client.messenger]['videoMessageJoi']({
            chatId: input.client.chat_id,
            videoPath: sails.config.custom.cloudinaryVideoUrl + input.messageData.message.video,
            html: htmlVideo,
          });

          sendMessageResult = videoRes;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSaveJoi({
            message_id: videoRes.payload.message_id || 0,
            message: JSON.stringify({
              video: sails.config.custom.cloudinaryVideoUrl + input.messageData.message.video,
              html: htmlVideo,
            }),
            message_format: sails.config.custom.enums.messageFormat.PUSHVIDEO,
            messenger: input.client.messenger,
            message_originator: sails.config.custom.enums.messageOriginator.BOT,
            client_id: input.client.id,
            client_guid: input.client.guid
          });

          break;

        case 'forced':

          /**
           * Send forced reply message
           */

          const htmlForced = await sails.helpers.messageProcessor.parseMessageStyleJoi({
            client: input.client,
            message: input.messageData.message,
            additionalTokens: input.additionalTokens,
          });

          const forcedRes = await sails.helpers.mgw[input.client.messenger]['forcedMessageJoi']({
            chatId: input.client.chat_id,
            html: htmlForced,
          });

          sendMessageResult = forcedRes;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSaveJoi({
            message_id: forcedRes.payload.message_id || 0,
            message: htmlForced,
            message_format: sails.config.custom.enums.messageFormat.PUSHFORCED,
            messenger: input.client.messenger,
            message_originator: sails.config.custom.enums.messageOriginator.BOT,
            client_id: input.client.id,
            client_guid: input.client.guid
          });

          break;

        case 'inline_keyboard':

          /**
           * Send inline keyboard message
           */

          const htmlInline = await sails.helpers.messageProcessor.parseMessageStyleJoi({
            client: input.client,
            message: input.messageData.message,
            additionalTokens: input.additionalTokens,
          });

          const inlineKeyboard = await sails.helpers.messageProcessor.mapDeepJoi({
            client: input.client,
            data: htmlInline.inline_keyboard,
          });

          const inlineRes = await sails.helpers.mgw[input.client.messenger]['inlineKeyboardMessageJoi']({
            chatId: input.client.chat_id,
            html: htmlInline,
            inlineKeyboard: inlineKeyboard,
          });

          sendMessageResult = inlineRes;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSaveJoi({
            message_id: inlineRes.payload.message_id || 0,
            message: htmlInline,
            message_format: sails.config.custom.enums.messageFormat.PUSHCALLBACK,
            messenger: input.client.messenger,
            message_originator: sails.config.custom.enums.messageOriginator.BOT,
            client_id: input.client.id,
            client_guid: input.client.guid,
            message_buttons: inlineKeyboard,
          });

          break;


      }

      /**
       * Call afterHelper to update block if needed
       */

      // put "afterHelper" call here...



      return exits.success(sendMessageResult);

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
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


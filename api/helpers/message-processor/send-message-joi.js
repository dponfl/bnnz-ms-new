"use strict";

const Joi = require('@hapi/joi');

// const parseMessageStyle = require('../../services/ParseMessageStyle').parseMessageStyle;
// const mapDeep = require('../../services/MapDeep').mapDeep;

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

    const schema = Joi
      .object({
        client: Joi
          .any()
          .required(),
        messageData: Joi
          .any()
          .required(),
        additionalTokens: Joi
          .any(),
        additionalParams: Joi
          .any(),
        blockModifyHelperParams: Joi
          .any(),
        beforeHelperParams: Joi
          .any(),
        afterHelperParams: Joi
          .any(),
        disableWebPagePreview: Joi
          .boolean()
          .description('flag to disable web page preview at message'),
    });

    let sendMessageResult = null;
    let messageData = null;

    let clientGuid;
    let accountGuid;


    try {

      const input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      messageData = input.messageData;

      const disableWebPagePreview = input.disableWebPagePreview || false;

      /**
       * Call blockModifyHelper to update block if needed
       */

      if (messageData.blockModifyHelper != null) {

        const performBlockModifyHelperJoiParams = {
          client: input.client,
          messageData,
        };

        if (input.blockModifyHelperParams != null) {
          performBlockModifyHelperJoiParams.additionalParams = input.blockModifyHelperParams;
        }

        messageData = await sails.helpers.messageProcessor.performBlockModifyHelperJoi(performBlockModifyHelperJoiParams);

      }

      switch (messageData.actionType) {

        case 'text':

          /**
           * Send simple text message
           */

          const htmlSimple = await MessageProcessor.parseMessageStyle({
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
            disableWebPagePreview,
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

          const htmlImg = await MessageProcessor.parseMessageStyle({
            client: input.client,
            message: input.messageData.message,
            additionalTokens: input.additionalTokens,
          });

          const imgRes = await sails.helpers.mgw[input.client.messenger]['imgMessageJoi']({
            chatId: input.client.chat_id,
            imgPath: (input.messageData.message.mediaLibrary) ? sails.config.custom.cloudinaryImgUrl + input.messageData.message.img : input.messageData.message.img,
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

          const htmlVideo = await MessageProcessor.parseMessageStyle({
            client: input.client,
            message: input.messageData.message,
            additionalTokens: input.additionalTokens,
          });

          const videoRes = await sails.helpers.mgw[input.client.messenger]['videoMessageJoi']({
            chatId: input.client.chat_id,
            videoPath: (input.messageData.message.mediaLibrary) ? sails.config.custom.cloudinaryVideoUrl + input.messageData.message.video : input.messageData.message.video,
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

        case 'sticker':

          /**
           * Send sticker message
           */

          const stickerRes = await sails.helpers.mgw[input.client.messenger]['stickerMessageJoi']({
            chatId: input.client.chat_id,
            stickerPath: (input.messageData.message.mediaLibrary) ? sails.config.custom.cloudinaryImgUrl + input.messageData.message.sticker : input.messageData.message.sticker,
          });

          sendMessageResult = stickerRes;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSaveJoi({
            message_id: stickerRes.payload.message_id || 0,
            message: JSON.stringify({
              sticker: sails.config.custom.cloudinaryImgUrl + input.messageData.message.sticker,
            }),
            message_format: sails.config.custom.enums.messageFormat.PUSHVIDEO,
            messenger: input.client.messenger,
            message_originator: sails.config.custom.enums.messageOriginator.BOT,
            client_id: input.client.id,
            client_guid: input.client.guid
          });

          break;

        case 'doc':

          /**
           * Send document message
           */

          let htmlDoc = await MessageProcessor.parseMessageStyle({
            client: input.client,
            message: input.messageData.message,
            additionalTokens: input.additionalTokens,
          });

          let docRes = await sails.helpers.mgw[input.client.messenger]['docMessageJoi']({
            chatId: input.client.chat_id,
            docPath: (input.messageData.message.mediaLibrary) ? sails.config.custom.cloudinaryDocUrl + input.messageData.message.doc : input.messageData.message.doc,
            html: htmlDoc,
          });

          sendMessageResult = docRes;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSaveJoi({
            message_id: docRes.payload.message_id || 0,
            message: JSON.stringify({
              doc: sails.config.custom.cloudinaryDocUrl + input.messageData.message.doc,
              html: htmlDoc,
            }),
            message_format: sails.config.custom.enums.messageFormat.DOC,
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

          const htmlForced = await MessageProcessor.parseMessageStyle({
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

          const htmlInline = await MessageProcessor.parseMessageStyle({
            client: input.client,
            message: input.messageData.message,
            additionalTokens: input.additionalTokens,
          });

          const inlineKeyboard = await MessageProcessor.mapDeep({
            client: input.client,
            data: input.messageData.message.inline_keyboard,
            additionalTokens: input.additionalTokens,
          });

          const inlineRes = await sails.helpers.mgw[input.client.messenger]['inlineKeyboardMessageJoi']({
            chatId: input.client.chat_id,
            html: htmlInline,
            inlineKeyboard: inlineKeyboard,
            disableWebPagePreview,
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

        case 'edit_message_text':

          /**
           * Edit message text
           */

          const htmlEditMessageText = await MessageProcessor.parseMessageStyle({
            client: input.client,
            message: input.messageData.message,
            additionalTokens: input.additionalTokens,
          });


          const editMessageTextRes = await sails.helpers.mgw[input.client.messenger]['editMessageTextJoi']({
            html: htmlEditMessageText,
            optionalParams: input.additionalParams,
          });

          if (
            _.isArray(input.messageData.message.inline_keyboard)
            && input.messageData.message.inline_keyboard.length > 0
          ) {

            const editMessageInlineKeyboard = await MessageProcessor.mapDeep({
              client: input.client,
              data: input.messageData.message.inline_keyboard,
              additionalTokens: input.additionalTokens,
            });

            const editMessageReplyMarkupRes = await sails.helpers.mgw[input.client.messenger]['editMessageReplyMarkupJoi']({
              replyMarkup: {
                inline_keyboard: editMessageInlineKeyboard
              },
              optionalParams: input.additionalParams,
            });

          }


          sendMessageResult = editMessageTextRes;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSaveJoi({
            message_id: editMessageTextRes.payload.message_id || 0,
            message: htmlEditMessageText,
            message_format: sails.config.custom.enums.messageFormat.PUSHCALLBACK,
            messenger: input.client.messenger,
            message_originator: sails.config.custom.enums.messageOriginator.BOT,
            client_id: input.client.id,
            client_guid: input.client.guid,
          });

          break;


      }

      /**
       * Call afterHelper if needed
       */

      if (messageData.afterHelper != null) {

        const performAfterHelperJoiParams = {
          client: input.client,
          messageData,
        };

        if (input.afterHelperParams != null) {
          performAfterHelperJoiParams.additionalParams = input.afterHelperParams;
        }

        await sails.helpers.messageProcessor.performAfterHelperJoi(performAfterHelperJoiParams);

      }

      return exits.success(sendMessageResult);

    } catch (e) {
      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
        });
        return exits.success({
          status: 'ok',
          message: `${moduleName} performed`,
          payload: {},
        });
      }
    }

  }

};


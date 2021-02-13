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

    let additionalTokens;

    let clientGuid;
    let accountGuid;


    try {

      const input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      // TODO: Нужно добавить контроль отправки сообщений только если
      //  клиент находится в какой-то клавиатуре
      //  (пример if (_.toString(currentAccount.keyboard) !== '')
      //  (что-бы не разрывать воронок или цепочек сообщений Chat Blasts)
      //  В противном случае формировать специальную pending-запись для последующей
      //  её обработки шедуллером.
      //  Также нужно добавить параметр "forced", который по умолчанию имеет значение
      //  false (что-бы не нарушать работу текущей реализации кода) и в этом случае
      //  действует правило, описанное выше. Если этот параметр имеет значение true,
      //  то проверка того, где находится клиент не выполняется (для возможности
      //  отправлять срочные сообщения).


      messageData = input.messageData;

      additionalTokens = input.additionalTokens;

      const disableWebPagePreview = input.disableWebPagePreview || false;

      /**
       * Если задан additionalTokensHelper, то вызываем его и добавляем полученные
       * токены к additionalTokens (если эта переменная задана)
       * или присваиваем их в эту переменную
       */

      if (messageData.additionalTokensHelper != null) {

        let splitAdditionalTokensHelperRes = _.split(messageData.additionalTokensHelper, sails.config.custom.JUNCTION, 3);
        let additionalTokensHelperCategory = splitAdditionalTokensHelperRes[0];
        let additionalTokensHelperBlock = splitAdditionalTokensHelperRes[1];
        let additionalTokensHelperName = splitAdditionalTokensHelperRes[2];

        if (additionalTokensHelperCategory && additionalTokensHelperBlock && additionalTokensHelperName) {

          /**
           * We managed to parse the specified additionalTokensHelper and can perform it
           */

          let additionalTokensHelperParams = {
            client: input.client,
          };

          const additionalTokensRes = await sails.helpers.pushMessages[additionalTokensHelperCategory][additionalTokensHelperBlock][additionalTokensHelperName](additionalTokensHelperParams);

          if (additionalTokensRes.status == null || additionalTokensRes.status !== 'success') {
            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'additionalTokensHelper wrong response',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.MESSAGE_PROCESSOR_ERROR.name,
              payload: {
                additionalTokensHelperCategory,
                additionalTokensHelperBlock,
                additionalTokensHelperName,
                additionalTokensRes,
              },
            });
          }

          if (additionalTokens != null) {

            additionalTokens = _.concat(additionalTokens, additionalTokensRes.payload);

          } else {

            additionalTokens = additionalTokensRes.payload;

          }

        } else {
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Cannot parse callback helper name',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.MESSAGE_PROCESSOR_ERROR.name,
            payload: {
              additionalTokensHelper: input.messageData.additionalTokensHelper,
              additionalTokensHelperCategory,
              additionalTokensHelperBlock,
              additionalTokensHelperName,
            },
          });
        }

      }


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

      const defaultLang = sails.config.custom.config.general.defaultLang.toLowerCase();
      const useLang = (_.has(sails.config.custom.config.lang, input.client.lang) ? input.client.lang : defaultLang);

      switch (messageData.actionType) {

        case 'text':

          /**
           * Send simple text message
           */

          const htmlSimple = await MessageProcessor.parseMessageStyle({
            client: input.client,
            message: messageData.message,
            additionalTokens,
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
            additionalTokens,
          });

          const imgPath = (input.messageData.message.mediaLibrary) ? `${sails.config.custom.mediaUrl}/${useLang}/${input.messageData.message.img}` : input.messageData.message.img;

          const imgRes = await sails.helpers.mgw[input.client.messenger]['imgMessageJoi']({
            chatId: input.client.chat_id,
            imgPath,
            html: htmlImg,
          });

          sendMessageResult = imgRes;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSaveJoi({
            message_id: imgRes.payload.message_id || 0,
            message: JSON.stringify({
              img: imgPath,
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
            additionalTokens,
          });

          const videoPath = (input.messageData.message.mediaLibrary) ? `${sails.config.custom.mediaUrl}/${useLang}/${input.messageData.message.video}` : input.messageData.message.video;

          const videoRes = await sails.helpers.mgw[input.client.messenger]['videoMessageJoi']({
            chatId: input.client.chat_id,
            videoPath,
            html: htmlVideo,
          });

          sendMessageResult = videoRes;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSaveJoi({
            message_id: videoRes.payload.message_id || 0,
            message: JSON.stringify({
              video: videoPath,
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

          const stickerPath = (input.messageData.message.mediaLibrary) ? `${sails.config.custom.mediaUrl}/${useLang}/${input.messageData.message.sticker}` : input.messageData.message.sticker;

          const stickerRes = await sails.helpers.mgw[input.client.messenger]['stickerMessageJoi']({
            chatId: input.client.chat_id,
            stickerPath,
          });

          sendMessageResult = stickerRes;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSaveJoi({
            message_id: stickerRes.payload.message_id || 0,
            message: JSON.stringify({
              sticker: stickerPath,
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
            additionalTokens,
          });

          const docPath = (input.messageData.message.mediaLibrary) ? `${sails.config.custom.mediaUrl}/${useLang}/${input.messageData.message.doc}` : input.messageData.message.doc;

          let docRes = await sails.helpers.mgw[input.client.messenger]['docMessageJoi']({
            chatId: input.client.chat_id,
            docPath,
            html: htmlDoc,
          });

          sendMessageResult = docRes;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSaveJoi({
            message_id: docRes.payload.message_id || 0,
            message: JSON.stringify({
              doc: docPath,
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
            additionalTokens,
          });

          const forcedRes = await sails.helpers.mgw[input.client.messenger]['forcedMessageJoi']({
            chatId: input.client.chat_id,
            html: htmlForced,
          });

          sendMessageResult = forcedRes;

          // TODO: Выставить флаг "forced_reply_expected"
          //  который означает, что клиенту было отправлено ForcedMessage
          //  и мы ожидаем получить ответ в виде ответа на ForcedMessage
          //  а не простым сообщением

          input.client.forced_reply_expected = true;

          await sails.helpers.storage.clientUpdateJoi({
            criteria: {guid: input.client.guid},
            data: {
              forced_reply_expected: input.client.forced_reply_expected,
            },
            createdBy: `${moduleName}`,
          });


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
            additionalTokens,
          });

          const inlineKeyboard = await MessageProcessor.mapDeep({
            client: input.client,
            data: input.messageData.message.inline_keyboard,
            additionalTokens,
          });

          const inlineRes = await sails.helpers.mgw[input.client.messenger]['inlineKeyboardMessageJoi']({
            chatId: input.client.chat_id,
            html: htmlInline,
            inlineKeyboard,
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

        case 'img_inline_keyboard':

          /**
           * Send img + inline keyboard message
           */

          const htmlImgInline = await MessageProcessor.parseMessageStyle({
            client: input.client,
            message: input.messageData.message,
            additionalTokens,
          });

          const imgInlineKeyboardPath = (input.messageData.message.mediaLibrary) ? `${sails.config.custom.mediaUrl}/${useLang}/${input.messageData.message.img}` : input.messageData.message.img;

          const imgInlineKeyboard = await MessageProcessor.mapDeep({
            client: input.client,
            data: input.messageData.message.inline_keyboard,
            additionalTokens,
          });

          const imgMessageJoiParams = {
            chatId: input.client.chat_id,
            imgPath: imgInlineKeyboardPath,
            html: htmlImgInline,
            inlineKeyboard: imgInlineKeyboard,
          };

          const imgInlineRes = await sails.helpers.mgw[input.client.messenger]['imgMessageJoi'](imgMessageJoiParams);

          sendMessageResult = imgInlineRes;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSaveJoi({
            message_id: imgInlineRes.payload.message_id || 0,
            message: JSON.stringify({
              img: imgInlineKeyboardPath,
              html: htmlImgInline,
            }),
            message_format: sails.config.custom.enums.messageFormat.PUSHIMGCALLBACK,
            messenger: input.client.messenger,
            message_originator: sails.config.custom.enums.messageOriginator.BOT,
            client_id: input.client.id,
            client_guid: input.client.guid,
            message_buttons: imgInlineKeyboard,
          });

          break;

        case 'video_inline_keyboard':

          /**
           * Send video + inline keyboard message
           */

          const htmlVideoInline = await MessageProcessor.parseMessageStyle({
            client: input.client,
            message: input.messageData.message,
            additionalTokens,
          });

          const videoInlineKeyboardPath = (input.messageData.message.mediaLibrary) ? `${sails.config.custom.mediaUrl}/${useLang}/${input.messageData.message.video}` : input.messageData.message.video;

          const videoInlineKeyboard = await MessageProcessor.mapDeep({
            client: input.client,
            data: input.messageData.message.inline_keyboard,
            additionalTokens,
          });

          const videoMessageJoiParams = {
            chatId: input.client.chat_id,
            videoPath: videoInlineKeyboardPath,
            html: htmlVideoInline,
            inlineKeyboard: videoInlineKeyboard,
          };

          const videoInlineRes = await sails.helpers.mgw[input.client.messenger]['videoMessageJoi'](videoMessageJoiParams);

          sendMessageResult = videoInlineRes;

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSaveJoi({
            message_id: videoInlineRes.payload.message_id || 0,
            message: JSON.stringify({
              video: videoInlineKeyboardPath,
              html: htmlVideoInline,
            }),
            message_format: sails.config.custom.enums.messageFormat.PUSHVIDEOCALLBACK,
            messenger: input.client.messenger,
            message_originator: sails.config.custom.enums.messageOriginator.BOT,
            client_id: input.client.id,
            client_guid: input.client.guid,
            message_buttons: videoInlineKeyboard,
          });

          break;

        case 'edit_message_text':

          /**
           * Edit message text
           */

          const htmlEditMessageText = await MessageProcessor.parseMessageStyle({
            client: input.client,
            message: input.messageData.message,
            additionalTokens,
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
              additionalTokens,
            });

            const editMessageReplyMarkupRes = await sails.helpers.mgw[input.client.messenger]['editMessageReplyMarkupJoi']({
              replyMarkup: {
                inline_keyboard: editMessageInlineKeyboard
              },
              optionalParams: input.additionalParams,
            });

            /**
             * Save the sent message with message buttons
             */

            await sails.helpers.storage.messageSaveJoi({
              message_id: editMessageTextRes.payload.message_id || 0,
              message: htmlEditMessageText,
              message_buttons: editMessageInlineKeyboard,
              message_format: sails.config.custom.enums.messageFormat.PUSHCALLBACK,
              messenger: input.client.messenger,
              message_originator: sails.config.custom.enums.messageOriginator.BOT,
              client_id: input.client.id,
              client_guid: input.client.guid,
            });


          } else {

            /**
             * Save the sent message without message buttons
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

          }


          sendMessageResult = editMessageTextRes;

          break;

        case 'edit_message_markup':

          /**
           * Edit message markup
           */

          if (input.messageData.message.inline_keyboard != null
            || _.isArray(input.messageData.message.inline_keyboard)
          ) {

            const editMessageMarkupInlineKeyboard = await MessageProcessor.mapDeep({
              client: input.client,
              data: input.messageData.message.inline_keyboard,
              additionalTokens,
            });

            const editMessageMarkupReplyMarkupRes = await sails.helpers.mgw[input.client.messenger]['editMessageReplyMarkupJoi']({
              replyMarkup: {
                inline_keyboard: editMessageMarkupInlineKeyboard
              },
              optionalParams: input.additionalParams,
            });

            sendMessageResult = editMessageMarkupReplyMarkupRes;

          }

          break;

        case 'dummy':

          /**
           * Use this type to just perform the afterHelper
           */

          sendMessageResult = {
            status: 'ok',
            message: 'Dummy message type was performed',
            payload: {},
          };

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
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
          },
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
          },
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


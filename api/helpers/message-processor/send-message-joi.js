"use strict";

const Joi = require('@hapi/joi');
const sleep = require('util').promisify(setTimeout);

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
        forced: Joi
          .boolean()
          .description('flag to send message ignoring "client.dnd"')
          .default(false),
        skipMsgQueue: Joi
          .boolean()
          .description('flag to send message w/o using message queue')
          .default(false),
    });

    let sendMessageResult = null;
    let messageData = null;

    let additionalTokens;

    let clientGuid;
    let accountGuid;
    let clientId;

    let msgSaveParams;
    let msgSaveRec;
    let messageGuid;
    let msgQueueCreateParams;


    try {

      const input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;
      clientId = input.client.id;

      const skipMsgQueue = input.skipMsgQueue;


      if (input.client.dnd && !input.forced) {

        /**
         * Клиенту сейчас нельзя отправлять сообщение
         * и не выставлен флаг отправки сообщения в любом случае
         */

        const pendingMessagesCreateParams = {
          clientGuid,
          accountGuid,
          payload: input,
        };

        const pendingMessageCreateRaw = await sails.helpers.storage.pendingMessagesCreateJoi(pendingMessagesCreateParams);

        if (pendingMessageCreateRaw.status == null
          || pendingMessageCreateRaw.status !== 'ok'
          || pendingMessageCreateRaw.payload == null) {
          await LogProcessor.critical({
            message: 'Wrong response from pendingMessagesCreateJoi',
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.GENERAL_ERROR.name,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
            location: moduleName,
            payload: {
              pendingMessagesCreateParams,
              pendingMessageCreateRaw,
            },
          });
        }

        return exits.success({
          status: 'ok',
          message: 'Message was saved in pending messages',
          payload: {
            clientGuid,
            accountGuid,
          },
        });

      }


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

          const htmlSimpleRaw = await MessageProcessor.parseMessageStyle({
            client: input.client,
            message: messageData.message,
            additionalTokens,
          });

          /**
           * Call beforeHelper to update block if needed
           */

          let {text: htmlSimple} = await activateBeforeHelper(input.client, messageData, htmlSimpleRaw, input.beforeHelperParams || null);

          if (skipMsgQueue) {

            const msgParams = {
              chatId: input.client.chat_id,
              html: htmlSimple,
              disableWebPagePreview,
            }

            const skipMsgQueueActionRes =  await skipMsgQueueAction(input.client, messageData.actionType, msgParams);

            if (
              !_.isNil(skipMsgQueueActionRes.status)
              && skipMsgQueueActionRes.status === 'success'
              && !_.isNil(skipMsgQueueActionRes.payload)
              && !_.isNil(skipMsgQueueActionRes.messageFormat)
              && !_.isNil(skipMsgQueueActionRes.messageId)
            ) {

              msgSaveParams = {
                msgSaveParams: {
                  action: sails.config.custom.enums.messageSaveActions.CREATE,
                  clientGuid,
                  accountGuid,
                  clientId: input.client.id,
                  messageId: skipMsgQueueActionRes.messageId,
                  message: msgParams,
                  messageFormat: skipMsgQueueActionRes.messageFormat,
                  channel: input.client.messenger,
                  messageOriginator: sails.config.custom.enums.messageOriginator.BOT,
                },
                createdBy: moduleName,
              };

              msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

            } else {

              /**
               * Сообщение так и не было отправлено => ставим его в очередь
               */

              msgSaveParams = {
                msgSaveParams: {
                  action: sails.config.custom.enums.messageSaveActions.CREATE,
                  clientGuid,
                  accountGuid,
                  clientId,
                },
                createdBy: moduleName,
              };

              msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

              messageGuid = msgSaveRec.messageGuid;

              msgQueueCreateParams = {
                clientGuid,
                accountGuid,
                messageGuid,
                channel: input.client.messenger,
                chatId: input.client.chat_id,
                clientId,
                msgType: 'simpleMessageJoi',
                payload: {
                  chatId: input.client.chat_id,
                  html: htmlSimple,
                  disableWebPagePreview,
                },
              };

              await sails.helpers.storage.msgQueueCreateWrapper({
                msgQueueCreateParams,
                createdBy: moduleName,
              });

            }


          } else {

            msgSaveParams = {
              msgSaveParams: {
                action: sails.config.custom.enums.messageSaveActions.CREATE,
                clientGuid,
                accountGuid,
                clientId,
              },
              createdBy: moduleName,
            };

            msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

            messageGuid = msgSaveRec.messageGuid;

            msgQueueCreateParams = {
              clientGuid,
              accountGuid,
              messageGuid,
              channel: input.client.messenger,
              chatId: input.client.chat_id,
              clientId,
              msgType: 'simpleMessageJoi',
              payload: {
                chatId: input.client.chat_id,
                html: htmlSimple,
                disableWebPagePreview,
              },
            };

            await sails.helpers.storage.msgQueueCreateWrapper({
              msgQueueCreateParams,
              createdBy: moduleName,
            });

          }

          sendMessageResult = msgSaveRec;

          // /**
          //  * Save the sent message
          //  */
          //
          // await sails.helpers.storage.messageSaveJoi({
          //   message_id: simpleRes.payload.message_id || 0,
          //   message: htmlSimple,
          //   message_format: sails.config.custom.enums.messageFormat.PUSHSIMPLE,
          //   messenger: input.client.messenger,
          //   message_originator: sails.config.custom.enums.messageOriginator.BOT,
          //   client_id: input.client.id,
          //   client_guid: input.client.guid
          // });

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

          // const imgRes = await sails.helpers.mgw[input.client.messenger]['imgMessageJoi']({
          //   chatId: input.client.chat_id,
          //   imgPath,
          //   html: htmlImg,
          // });

          msgSaveParams = {
            msgSaveParams: {
              action: sails.config.custom.enums.messageSaveActions.CREATE,
              clientGuid,
              accountGuid,
              clientId,
            },
            createdBy: moduleName,
          };

          msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

          messageGuid = msgSaveRec.messageGuid;

          msgQueueCreateParams = {
            clientGuid,
            accountGuid,
            messageGuid,
            channel: input.client.messenger,
            chatId: input.client.chat_id,
            clientId,
            msgType: 'imgMessageJoi',
            payload: {
              chatId: input.client.chat_id,
              imgPath,
              html: htmlImg,
            },
          };

          await sails.helpers.storage.msgQueueCreateWrapper({
            msgQueueCreateParams,
            createdBy: moduleName,
          });


          sendMessageResult = msgSaveRec;

          // /**
          //  * Save the sent message
          //  */
          //
          // await sails.helpers.storage.messageSaveJoi({
          //   message_id: imgRes.payload.message_id || 0,
          //   message: JSON.stringify({
          //     img: imgPath,
          //     html: htmlImg,
          //   }),
          //   message_format: sails.config.custom.enums.messageFormat.PUSHIMG,
          //   messenger: input.client.messenger,
          //   message_originator: sails.config.custom.enums.messageOriginator.BOT,
          //   client_id: input.client.id,
          //   client_guid: input.client.guid
          // });

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

          // const videoRes = await sails.helpers.mgw[input.client.messenger]['videoMessageJoi']({
          //   chatId: input.client.chat_id,
          //   videoPath,
          //   html: htmlVideo,
          // });

          msgSaveParams = {
            msgSaveParams: {
              action: sails.config.custom.enums.messageSaveActions.CREATE,
              clientGuid,
              accountGuid,
              clientId,
            },
            createdBy: moduleName,
          };

          msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

          messageGuid = msgSaveRec.messageGuid;

          msgQueueCreateParams = {
            clientGuid,
            accountGuid,
            messageGuid,
            channel: input.client.messenger,
            chatId: input.client.chat_id,
            clientId,
            msgType: 'videoMessageJoi',
            payload: {
              chatId: input.client.chat_id,
              videoPath,
              html: htmlVideo,
            },
          };

          await sails.helpers.storage.msgQueueCreateWrapper({
            msgQueueCreateParams,
            createdBy: moduleName,
          });


          sendMessageResult = msgSaveRec;

          // /**
          //  * Save the sent message
          //  */
          //
          // await sails.helpers.storage.messageSaveJoi({
          //   message_id: videoRes.payload.message_id || 0,
          //   message: JSON.stringify({
          //     video: videoPath,
          //     html: htmlVideo,
          //   }),
          //   message_format: sails.config.custom.enums.messageFormat.PUSHVIDEO,
          //   messenger: input.client.messenger,
          //   message_originator: sails.config.custom.enums.messageOriginator.BOT,
          //   client_id: input.client.id,
          //   client_guid: input.client.guid
          // });

          break;

        case 'sticker':

          /**
           * Send sticker message
           */

          const stickerPath = (input.messageData.message.mediaLibrary) ? `${sails.config.custom.mediaUrl}/${useLang}/${input.messageData.message.sticker}` : input.messageData.message.sticker;

          // const stickerRes = await sails.helpers.mgw[input.client.messenger]['stickerMessageJoi']({
          //   chatId: input.client.chat_id,
          //   stickerPath,
          // });

          msgSaveParams = {
            msgSaveParams: {
              action: sails.config.custom.enums.messageSaveActions.CREATE,
              clientGuid,
              accountGuid,
              clientId,
            },
            createdBy: moduleName,
          };

          msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

          messageGuid = msgSaveRec.messageGuid;

          msgQueueCreateParams = {
            clientGuid,
            accountGuid,
            messageGuid,
            channel: input.client.messenger,
            chatId: input.client.chat_id,
            clientId,
            msgType: 'stickerMessageJoi',
            payload: {
              chatId: input.client.chat_id,
              stickerPath,
            },
          };

          await sails.helpers.storage.msgQueueCreateWrapper({
            msgQueueCreateParams,
            createdBy: moduleName,
          });


          sendMessageResult = msgSaveRec;

          // /**
          //  * Save the sent message
          //  */
          //
          // await sails.helpers.storage.messageSaveJoi({
          //   message_id: stickerRes.payload.message_id || 0,
          //   message: JSON.stringify({
          //     sticker: stickerPath,
          //   }),
          //   message_format: sails.config.custom.enums.messageFormat.PUSHVIDEO,
          //   messenger: input.client.messenger,
          //   message_originator: sails.config.custom.enums.messageOriginator.BOT,
          //   client_id: input.client.id,
          //   client_guid: input.client.guid
          // });

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

          // let docRes = await sails.helpers.mgw[input.client.messenger]['docMessageJoi']({
          //   chatId: input.client.chat_id,
          //   docPath,
          //   html: htmlDoc,
          // });

          msgSaveParams = {
            msgSaveParams: {
              action: sails.config.custom.enums.messageSaveActions.CREATE,
              clientGuid,
              accountGuid,
              clientId,
            },
            createdBy: moduleName,
          };

          msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

          messageGuid = msgSaveRec.messageGuid;

          msgQueueCreateParams = {
            clientGuid,
            accountGuid,
            messageGuid,
            channel: input.client.messenger,
            chatId: input.client.chat_id,
            clientId,
            msgType: 'docMessageJoi',
            payload: {
              chatId: input.client.chat_id,
              docPath,
              html: htmlDoc,
            },
          };

          await sails.helpers.storage.msgQueueCreateWrapper({
            msgQueueCreateParams,
            createdBy: moduleName,
          });


          sendMessageResult = msgSaveRec;

          // /**
          //  * Save the sent message
          //  */
          //
          // await sails.helpers.storage.messageSaveJoi({
          //   message_id: docRes.payload.message_id || 0,
          //   message: JSON.stringify({
          //     doc: docPath,
          //     html: htmlDoc,
          //   }),
          //   message_format: sails.config.custom.enums.messageFormat.DOC,
          //   messenger: input.client.messenger,
          //   message_originator: sails.config.custom.enums.messageOriginator.BOT,
          //   client_id: input.client.id,
          //   client_guid: input.client.guid
          // });

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

          // const forcedRes = await sails.helpers.mgw[input.client.messenger]['forcedMessageJoi']({
          //   chatId: input.client.chat_id,
          //   html: htmlForced,
          // });

          msgSaveParams = {
            msgSaveParams: {
              action: sails.config.custom.enums.messageSaveActions.CREATE,
              clientGuid,
              accountGuid,
              clientId,
            },
            createdBy: moduleName,
          };

          msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

          messageGuid = msgSaveRec.messageGuid;

          msgQueueCreateParams = {
            clientGuid,
            accountGuid,
            messageGuid,
            channel: input.client.messenger,
            chatId: input.client.chat_id,
            clientId,
            msgType: 'forcedMessageJoi',
            payload: {
              chatId: input.client.chat_id,
              html: htmlForced,
            },
          };

          await sails.helpers.storage.msgQueueCreateWrapper({
            msgQueueCreateParams,
            createdBy: moduleName,
          });


          sendMessageResult = msgSaveRec;

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


          // /**
          //  * Save the sent message
          //  */
          //
          // await sails.helpers.storage.messageSaveJoi({
          //   message_id: forcedRes.payload.message_id || 0,
          //   message: htmlForced,
          //   message_format: sails.config.custom.enums.messageFormat.PUSHFORCED,
          //   messenger: input.client.messenger,
          //   message_originator: sails.config.custom.enums.messageOriginator.BOT,
          //   client_id: input.client.id,
          //   client_guid: input.client.guid
          // });

          break;

        case 'inline_keyboard':

          /**
           * Send inline keyboard message
           */

          const htmlInlineRaw = await MessageProcessor.parseMessageStyle({
            client: input.client,
            message: input.messageData.message,
            additionalTokens,
          });

          let {text: htmlInline, inline_keyboard: keyboardInline} = await activateBeforeHelper(input.client, messageData, htmlInlineRaw, input.beforeHelperParams || null);

          const inlineKeyboard = await MessageProcessor.mapDeep({
            client: input.client,
            data: keyboardInline,
            additionalTokens,
          });

          // const inlineRes = await sails.helpers.mgw[input.client.messenger]['inlineKeyboardMessageJoi']({
          //   chatId: input.client.chat_id,
          //   html: htmlInline,
          //   inlineKeyboard,
          //   disableWebPagePreview,
          // });

          msgSaveParams = {
            msgSaveParams: {
              action: sails.config.custom.enums.messageSaveActions.CREATE,
              clientGuid,
              accountGuid,
              clientId,
            },
            createdBy: moduleName,
          };

          msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

          messageGuid = msgSaveRec.messageGuid;

          msgQueueCreateParams = {
            clientGuid,
            accountGuid,
            messageGuid,
            channel: input.client.messenger,
            chatId: input.client.chat_id,
            clientId,
            msgType: 'inlineKeyboardMessageJoi',
            payload: {
              chatId: input.client.chat_id,
              html: htmlInline,
              inlineKeyboard,
              disableWebPagePreview,
            },
          };

          await sails.helpers.storage.msgQueueCreateWrapper({
            msgQueueCreateParams,
            createdBy: moduleName,
          });


          sendMessageResult = msgSaveRec;

          // /**
          //  * Save the sent message
          //  */
          //
          // await sails.helpers.storage.messageSaveJoi({
          //   message_id: inlineRes.payload.message_id || 0,
          //   message: htmlInline,
          //   message_format: sails.config.custom.enums.messageFormat.PUSHINLINEKEYBOARD,
          //   messenger: input.client.messenger,
          //   message_originator: sails.config.custom.enums.messageOriginator.BOT,
          //   client_id: input.client.id,
          //   client_guid: input.client.guid,
          //   message_buttons: inlineKeyboard,
          // });

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

          // const imgInlineRes = await sails.helpers.mgw[input.client.messenger]['imgMessageJoi'](imgMessageJoiParams);

          msgSaveParams = {
            msgSaveParams: {
              action: sails.config.custom.enums.messageSaveActions.CREATE,
              clientGuid,
              accountGuid,
              clientId,
            },
            createdBy: moduleName,
          };

          msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

          messageGuid = msgSaveRec.messageGuid;

          msgQueueCreateParams = {
            clientGuid,
            accountGuid,
            messageGuid,
            channel: input.client.messenger,
            chatId: input.client.chat_id,
            clientId,
            msgType: 'imgMessageJoi',
            payload: imgMessageJoiParams,
          };

          await sails.helpers.storage.msgQueueCreateWrapper({
            msgQueueCreateParams,
            createdBy: moduleName,
          });


          sendMessageResult = msgSaveRec;

          // /**
          //  * Save the sent message
          //  */
          //
          // await sails.helpers.storage.messageSaveJoi({
          //   message_id: imgInlineRes.payload.message_id || 0,
          //   message: JSON.stringify({
          //     img: imgInlineKeyboardPath,
          //     html: htmlImgInline,
          //   }),
          //   message_format: sails.config.custom.enums.messageFormat.PUSHIMGINLINEKEYBOARD,
          //   messenger: input.client.messenger,
          //   message_originator: sails.config.custom.enums.messageOriginator.BOT,
          //   client_id: input.client.id,
          //   client_guid: input.client.guid,
          //   message_buttons: imgInlineKeyboard,
          // });

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

          // const videoInlineRes = await sails.helpers.mgw[input.client.messenger]['videoMessageJoi'](videoMessageJoiParams);

          msgSaveParams = {
            msgSaveParams: {
              action: sails.config.custom.enums.messageSaveActions.CREATE,
              clientGuid,
              accountGuid,
              clientId,
            },
            createdBy: moduleName,
          };

          msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

          messageGuid = msgSaveRec.messageGuid;

          msgQueueCreateParams = {
            clientGuid,
            accountGuid,
            messageGuid,
            channel: input.client.messenger,
            chatId: input.client.chat_id,
            clientId,
            msgType: 'videoMessageJoi',
            payload: videoMessageJoiParams,
          };

          await sails.helpers.storage.msgQueueCreateWrapper({
            msgQueueCreateParams,
            createdBy: moduleName,
          });


          sendMessageResult = msgSaveRec;

          // /**
          //  * Save the sent message
          //  */
          //
          // await sails.helpers.storage.messageSaveJoi({
          //   message_id: videoInlineRes.payload.message_id || 0,
          //   message: JSON.stringify({
          //     video: videoInlineKeyboardPath,
          //     html: htmlVideoInline,
          //   }),
          //   message_format: sails.config.custom.enums.messageFormat.PUSHVIDEOINLINEKEYBOARD,
          //   messenger: input.client.messenger,
          //   message_originator: sails.config.custom.enums.messageOriginator.BOT,
          //   client_id: input.client.id,
          //   client_guid: input.client.guid,
          //   message_buttons: videoInlineKeyboard,
          // });

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


          // const editMessageTextRes = await sails.helpers.mgw[input.client.messenger]['editMessageTextJoi']({
          //   html: htmlEditMessageText,
          //   optionalParams: input.additionalParams,
          // });

          msgSaveParams = {
            msgSaveParams: {
              action: sails.config.custom.enums.messageSaveActions.CREATE,
              clientGuid,
              accountGuid,
              clientId,
            },
            createdBy: moduleName,
          };

          msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

          messageGuid = msgSaveRec.messageGuid;

          msgQueueCreateParams = {
            clientGuid,
            accountGuid,
            messageGuid,
            channel: input.client.messenger,
            chatId: input.client.chat_id,
            clientId,
            msgType: 'editMessageTextJoi',
            payload: {
              html: htmlEditMessageText,
              optionalParams: input.additionalParams,
            },
          };

          await sails.helpers.storage.msgQueueCreateWrapper({
            msgQueueCreateParams,
            createdBy: moduleName,
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

            // const editMessageReplyMarkupRes = await sails.helpers.mgw[input.client.messenger]['editMessageReplyMarkupJoi']({
            //   replyMarkup: {
            //     inline_keyboard: editMessageInlineKeyboard
            //   },
            //   optionalParams: input.additionalParams,
            // });

            msgSaveParams = {
              msgSaveParams: {
                action: sails.config.custom.enums.messageSaveActions.CREATE,
                clientGuid,
                accountGuid,
                clientId,
              },
              createdBy: moduleName,
            };

            msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

            messageGuid = msgSaveRec.messageGuid;

            msgQueueCreateParams = {
              clientGuid,
              accountGuid,
              messageGuid,
              channel: input.client.messenger,
              chatId: input.client.chat_id,
              clientId,
              msgType: 'editMessageReplyMarkupJoi',
              payload: {
                replyMarkup: {
                  inline_keyboard: editMessageInlineKeyboard
                },
                optionalParams: input.additionalParams,
              },
            };

            await sails.helpers.storage.msgQueueCreateWrapper({
              msgQueueCreateParams,
              createdBy: moduleName,
            });


            // /**
            //  * Save the sent message with message buttons
            //  */
            //
            // await sails.helpers.storage.messageSaveJoi({
            //   message_id: editMessageTextRes.payload.message_id || 0,
            //   message: htmlEditMessageText,
            //   message_buttons: editMessageInlineKeyboard,
            //   message_format: sails.config.custom.enums.messageFormat.PUSHINLINEKEYBOARD,
            //   messenger: input.client.messenger,
            //   message_originator: sails.config.custom.enums.messageOriginator.BOT,
            //   client_id: input.client.id,
            //   client_guid: input.client.guid,
            // });


          }


          sendMessageResult = msgSaveRec;

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

            // const editMessageMarkupReplyMarkupRes = await sails.helpers.mgw[input.client.messenger]['editMessageReplyMarkupJoi']({
            //   replyMarkup: {
            //     inline_keyboard: editMessageMarkupInlineKeyboard
            //   },
            //   optionalParams: input.additionalParams,
            // });

            if (skipMsgQueue) {

              const msgParams = {
                replyMarkup: {
                  inline_keyboard: editMessageMarkupInlineKeyboard
                },
                optionalParams: input.additionalParams,
              }

              const skipMsgQueueActionRes =  await skipMsgQueueAction(input.client, messageData.actionType, msgParams);

              if (
                !_.isNil(skipMsgQueueActionRes.status)
                && skipMsgQueueActionRes.status === 'success'
                && !_.isNil(skipMsgQueueActionRes.payload)
                && !_.isNil(skipMsgQueueActionRes.messageFormat)
                && !_.isNil(skipMsgQueueActionRes.messageId)
              ) {

                msgSaveParams = {
                  msgSaveParams: {
                    action: sails.config.custom.enums.messageSaveActions.CREATE,
                    clientGuid,
                    accountGuid,
                    clientId: input.client.id,
                    messageId: skipMsgQueueActionRes.messageId,
                    message: msgParams,
                    messageFormat: skipMsgQueueActionRes.messageFormat,
                    channel: input.client.messenger,
                    messageOriginator: sails.config.custom.enums.messageOriginator.BOT,
                  },
                  createdBy: moduleName,
                };

                msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

              } else {

                /**
                 * Сообщение так и не было отправлено => ставим его в очередь
                 */

                msgSaveParams = {
                  msgSaveParams: {
                    action: sails.config.custom.enums.messageSaveActions.CREATE,
                    clientGuid,
                    accountGuid,
                    clientId,
                  },
                  createdBy: moduleName,
                };

                const messageId = _.get(input.additionalParams, 'message_id', null);

                if (!_.isNil(messageId)) {

                  msgSaveParams.msgSaveParams.messageId = _.toString(messageId);

                }

                msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

                messageGuid = msgSaveRec.messageGuid;

                msgQueueCreateParams = {
                  clientGuid,
                  accountGuid,
                  messageGuid,
                  channel: input.client.messenger,
                  chatId: input.client.chat_id,
                  clientId,
                  msgType: 'editMessageReplyMarkupJoi',
                  payload: {
                    replyMarkup: {
                      inline_keyboard: editMessageMarkupInlineKeyboard
                    },
                    optionalParams: input.additionalParams,
                  },
                };

                await sails.helpers.storage.msgQueueCreateWrapper({
                  msgQueueCreateParams,
                  createdBy: moduleName,
                });

              }

            } else {

              msgSaveParams = {
                msgSaveParams: {
                  action: sails.config.custom.enums.messageSaveActions.CREATE,
                  clientGuid,
                  accountGuid,
                  clientId,
                },
                createdBy: moduleName,
              };

              const messageId = _.get(input.additionalParams, 'message_id', null);

              if (!_.isNil(messageId)) {

                msgSaveParams.msgSaveParams.messageId = _.toString(messageId);

              }

              msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

              messageGuid = msgSaveRec.messageGuid;

              msgQueueCreateParams = {
                clientGuid,
                accountGuid,
                messageGuid,
                channel: input.client.messenger,
                chatId: input.client.chat_id,
                clientId,
                msgType: 'editMessageReplyMarkupJoi',
                payload: {
                  replyMarkup: {
                    inline_keyboard: editMessageMarkupInlineKeyboard
                  },
                  optionalParams: input.additionalParams,
                },
              };

              await sails.helpers.storage.msgQueueCreateWrapper({
                msgQueueCreateParams,
                createdBy: moduleName,
              });

            }

            sendMessageResult = msgSaveRec;

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

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: sendMessageResult,
      });

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

async function activateBeforeHelper(client, block, htmlMsg, params) {

  const clientGuid = client.guid;
  const accountGuid = client.account_use;

  let messageContent = {
    text: htmlMsg,
    inline_keyboard: block.message.inline_keyboard || null,
    img: block.message.img || null,
    video: block.message.video || null,
    doc: block.message.doc || null,
  };

  if (!_.isNil(block.beforeHelper)) {

    let splitBeforeHelperRes = _.split(block.beforeHelper, sails.config.custom.JUNCTION, 3);
    let beforeHelperCategory = splitBeforeHelperRes[0];
    let beforeHelperBlock = splitBeforeHelperRes[1];
    let beforeHelperName = splitBeforeHelperRes[2];

    if (beforeHelperCategory && beforeHelperBlock && beforeHelperName) {

      /**
       * We managed to parse the specified beforeHelper and can perform it
       */

      let beforeHelperParams = {
        client: client,
        messageContent,
        additionalParams: params || null,
      };

      messageContent = await sails.helpers.pushMessages[beforeHelperCategory][beforeHelperBlock][beforeHelperName](beforeHelperParams);

    } else {

      /**
       * Throw error: we could not parse the specified beforeHelper
       */

      await sails.helpers.general.throwErrorJoi({
        errorType: sails.config.custom.enums.errorType.CRITICAL,
        emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
        location: moduleName,
        message: 'Could not parse beforeHelper name',
        clientGuid,
        accountGuid,
        errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
        payload: {
          beforeHelper: block.beforeHelper,
          beforeHelperCategory,
          beforeHelperBlock,
          beforeHelperName,
        },
      });

    }

  }

  return messageContent;

}

async function skipMsgQueueAction(client, msgType, msgParams) {

  const methodName = 'skipMsgQueueAction';

  let res;
  let messageFormat;
  let messageId;
  let chatId;

  let intervals;
  let done = false;
  let performed = false;
  let intervalIndex = 0;

  try {

    intervals = sails.config.custom.config.messageOrchestrator.telegram.skipMsgQueueDelays || [100, 300, 500];

    while (!done) {

      switch (msgType) {

        case 'text':

          res = await sails.helpers.mgw[client.messenger]['simpleMessageJoi'](msgParams);
          messageFormat = sails.config.custom.enums.messageFormat.SIMPLE;

          break;

        case 'edit_message_markup':

          res = await sails.helpers.mgw[client.messenger]['editMessageReplyMarkupJoi'](msgParams);
          messageFormat = sails.config.custom.enums.messageFormat.EDIT_RM;

          break;

      }

      if (
        !_.isNil(res.status)
        && res.status === 'ok'
        && !_.isNil(res.payload)
      ) {

        messageId = _.toString(_.get(res.payload, 'message_id', 0));
        chatId = _.get(res.payload, 'chat.id', 0);

        if (
          messageId !== '0'
          || chatId !== 0
          || res.payload === true
        ) {

          performed = true;
          done = true;

        }

      } else if (
        !_.isNil(res.status)
        && res.status === 'error'
        && !_.isNil(res.payload.error.code)
        && res.payload.error.code === 'ETELEGRAM'
        && !_.isNil(res.payload.error.response.statusCode)
        && res.payload.error.response.statusCode === 429
      ) {

        /**
         * Получена ошибка Телеграм об отправке сообщений сверх
         * лимита в еденицу времени
         * Пытаемся повторно отправить сообщение с задержкой
         */


        if (intervalIndex < intervals.length) {

          await sleep(intervals[intervalIndex]);
          intervalIndex++;

        } else {

          done = true;

        }

      } else {

        /**
         * Другая ошибка нежели кол-во сообщений сверх лимита - выходим
         */

        done = true;

      }

    }

    if (performed) {

      return {
        status: 'success',
        payload: res,
        messageFormat,
        messageId,
      }

    } else {

      return {
        status: 'notPerformed',
      }

    }

  } catch (e) {

    return {
      status: 'error',
      payload: {
        error: e,
      }
    }

  }

}

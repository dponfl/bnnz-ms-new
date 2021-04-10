"use strict";

const Joi = require('@hapi/joi');
const sleep = require('util').promisify(setTimeout);

const moduleName = 'funnel:proceed-next-block-joi';

// const t = require('../../services/translate').t;
// const confObj = require('../../services/translate').getConfigObj;
// const emoji = require('node-emoji');



module.exports = {


  friendlyName: 'Proceed next block',


  description: 'Proceed next block',


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

    /**
     * Recursive function to show all linked blocks that meets conditions
     */

    const schema = Joi.object({
      client: Joi
        .any()
        .description('Client record')
        .required(),
      funnelName: Joi
        .string()
        .description('Funnel name')
        .required(),
      blockId: Joi
        .string()
        .description('Funnel block id')
        .required(),
      additionalTokens: Joi
        .any(),
      msg: Joi
        .any()
        .description('Message received'),
      createdBy: Joi
        .string()
        .description('source of update')
        .required(),
      throwError: Joi
        .boolean()
        .description('true if we want to throw error further'),
    });

    let block = null;
    let funnel = null;
    let input;
    let throwError = true;

    let clientGuid;
    let accountGuid;
    let clientId;

    let disableWebPagePreview;

    let msgSaveParams;
    let msgSaveRec;
    let messageGuid;
    let msgQueueCreateParams;


    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;
      clientId = input.client.id;

      if (input.throwError === false) {
        throwError = input.throwError;
      }

      if (!_.has(input.client.funnels, input.funnelName)) {
        // throw new Error(`funnel not found, \nfunnels: ${JSON.stringify(input.client.funnels, null, 3)} \n\nfunnelName : ${input.funnelName}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'funnel not found',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR.name,
          payload: {
            funnelName: input.funnelName,
            inputClientFunnels: input.client.funnels,
          },
        });

      }

      funnel = input.client.funnels[input.funnelName];

      block = _.find(funnel, {id: input.blockId});

      if (_.isNil(block)) {
        // throw new Error(`block not found, \nfunnelName: ${input.funnelName} \nblockId : ${input.blockId}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'block not found',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR.name,
          payload: {
            blockId: input.blockId,
            funnel,
          },
        });

      }

      disableWebPagePreview = block.disableWebPagePreview || false;

      if (
        block.enabled
        && !block.shown
        && !block.done
        && block.actionType
      ) {

        /**
         * Сохраняем информацию о прохождении данного блока клиентом
         */

        await sails.helpers.storage.clientJourneyCreateJoi({
          clientGuid,
          accountGuid,
          funnelName: input.funnelName,
          blockId: input.blockId,
        });

        /**
         * Call blockModifyHelper to update block if needed
         */

        block = await activateBlockModifyHelper(input.client, block);

        const defaultLang = sails.config.custom.config.general.defaultLang.toLowerCase();
        const useLang = (_.has(sails.config.custom.config.lang, input.client.lang) ? input.client.lang : defaultLang);

        switch (block.actionType) {

          case 'text':

            /**
             * Send simple text message
             */

            let htmlSimpleRaw = await MessageProcessor.parseMessageStyle({
                client: input.client,
                message: block.message,
                additionalTokens: input.additionalTokens,
              });

            let {text: htmlSimple} = await activateBeforeHelper(input.client, block, input.msg || null, htmlSimpleRaw);

            // let simpleRes = await sails.helpers.mgw[input.client.messenger]['simpleMessageJoi']({
            //   chatId: input.client.chat_id,
            //   html: htmlSimple,
            //   removeKeyboard: block.removeKeyboard,
            //   disableWebPagePreview,
            // });

            msgSaveParams = {
              msgSaveParams: {
                clientGuid,
                accountGuid,
                clientId,
              },
              createdBy: moduleName,
            };

            msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

            messageGuid = msgSaveRec.messageGuid || null;

            msgQueueCreateParams = {
              clientGuid,
              accountGuid,
              messageGuid,
              channel: input.client.messenger,
              chatId: input.client.chat_id,
              clientId: input.client.id,
              msgType: 'simpleMessageJoi',
              payload: {
                chatId: input.client.chat_id,
                html: htmlSimple,
                removeKeyboard: block.removeKeyboard,
                disableWebPagePreview,
              },
            };

            await sails.helpers.storage.msgQueueCreateWrapper({
              msgQueueCreateParams,
              createdBy: moduleName,
            })

            block.messageGuid = messageGuid;


            // /**
            //  * Save the sent message
            //  */
            //
            // await sails.helpers.storage.messageSaveJoi({
            //   message_id: simpleRes.payload.message_id || 0,
            //   message: htmlSimple,
            //   message_format: sails.config.custom.enums.messageFormat.SIMPLE,
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

            let htmlImgRaw = await MessageProcessor.parseMessageStyle({
              client: input.client,
              message: block.message,
              additionalTokens: input.additionalTokens,
            });

            let {text: htmlImg} = await activateBeforeHelper(input.client, block, input.msg || null, htmlImgRaw);

            const imgPath = (block.message.mediaLibrary) ? `${sails.config.custom.mediaUrl}/${useLang}/${block.message.img}` : block.message.img;

            // let imgRes = await sails.helpers.mgw[input.client.messenger]['imgMessageJoi']({
            //   chatId: input.client.chat_id,
            //   imgPath,
            //   html: htmlImg,
            // });

            msgSaveParams = {
              msgSaveParams: {
                clientGuid,
                accountGuid,
                clientId,
              },
              createdBy: moduleName,
            };

            msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

            messageGuid = msgSaveRec.messageGuid || null;

            msgQueueCreateParams = {
              clientGuid,
              accountGuid,
              messageGuid,
              channel: input.client.messenger,
              chatId: input.client.chat_id,
              clientId: input.client.id,
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
            })

            block.messageGuid = messageGuid;


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
            //   message_format: sails.config.custom.enums.messageFormat.IMG,
            //   messenger: input.client.messenger,
            //   message_originator: sails.config.custom.enums.messageOriginator.BOT,
            //   client_id: input.client.id,
            //   client_guid: input.client.guid
            // });

            break;

          case 'img_inline_keyboard':

            /**
             * Send img + inline keyboard message
             */

            let htmlImgInlineKeyboardRaw = await MessageProcessor.parseMessageStyle({
              client: input.client,
              message: block.message,
              additionalTokens: input.additionalTokens,
            });

            let {text: htmlImgInlineKeyboard, inline_keyboard: keyboardInlineImg, img: parsedImgPath} = await activateBeforeHelper(input.client, block, input.msg || null, htmlImgInlineKeyboardRaw);

            const imgInlineKeyboardPath = (block.message.mediaLibrary) ? `${sails.config.custom.mediaUrl}/${useLang}/${parsedImgPath}` : parsedImgPath;

            const imgMessageJoiParams = {
              chatId: input.client.chat_id,
              imgPath: imgInlineKeyboardPath,
              html: htmlImgInlineKeyboard,
            };

            if (keyboardInlineImg != null) {

              imgMessageJoiParams.inlineKeyboard = await MessageProcessor.mapDeep({
                client: input.client,
                data: keyboardInlineImg,
                additionalTokens: input.additionalTokens,
              });

            }

            // let imgInlineKeyboardRes = await sails.helpers.mgw[input.client.messenger]['imgMessageJoi'](imgMessageJoiParams);

            msgSaveParams = {
              msgSaveParams: {
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
              clientId: input.client.id,
              msgType: 'imgMessageJoi',
              payload: imgMessageJoiParams,
            };

            await sails.helpers.storage.msgQueueCreateWrapper({
              msgQueueCreateParams,
              createdBy: moduleName,
            });

            block.messageGuid = messageGuid;


            // /**
            //  * Save the sent message
            //  */
            //
            // await sails.helpers.storage.messageSaveJoi({
            //   message_id: imgInlineKeyboardRes.payload.message_id || 0,
            //   message: JSON.stringify({
            //     img: imgInlineKeyboardPath,
            //     html: htmlImgInlineKeyboard,
            //   }),
            //   message_buttons: imgMessageJoiParams.inlineKeyboard,
            //   message_format: sails.config.custom.enums.messageFormat.IMGINLINEKEYBOARD,
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

            let htmlVideoRaw = await MessageProcessor.parseMessageStyle({
              client: input.client,
              message: block.message,
              additionalTokens: input.additionalTokens,
            });

            let {text: htmlVideo} = await activateBeforeHelper(input.client, block, input.msg || null, htmlVideoRaw);

            const videoPath = (block.message.mediaLibrary) ? `${sails.config.custom.mediaUrl}/${useLang}/${block.message.video}` : block.message.video;


            // let videoRes = await sails.helpers.mgw[input.client.messenger]['videoMessageJoi']({
            //   chatId: input.client.chat_id,
            //   videoPath,
            //   html: htmlVideo,
            // });

            msgSaveParams = {
              msgSaveParams: {
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
              clientId: input.client.id,
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


            block.messageGuid = messageGuid;


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
            //   message_format: sails.config.custom.enums.messageFormat.VIDEO,
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

            const stickerPath = (block.message.mediaLibrary) ? `${sails.config.custom.mediaUrl}/${useLang}/${block.message.sticker}` : block.message.sticker;


            // let stickerRes = await sails.helpers.mgw[input.client.messenger]['stickerMessageJoi']({
            //   chatId: input.client.chat_id,
            //   stickerPath,
            // });

            msgSaveParams = {
              msgSaveParams: {
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
              clientId: input.client.id,
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


            block.messageGuid = messageGuid;


            // /**
            //  * Save the sent message
            //  */
            //
            // await sails.helpers.storage.messageSaveJoi({
            //   message_id: stickerRes.payload.message_id || 0,
            //   message: JSON.stringify({
            //     sticker: stickerPath,
            //   }),
            //   message_format: sails.config.custom.enums.messageFormat.STICKER,
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

            let htmlDocRaw = await MessageProcessor.parseMessageStyle({
                client: input.client,
                message: block.message,
                additionalTokens: input.additionalTokens,
              });

            let {text: htmlDoc} = await activateBeforeHelper(input.client, block, input.msg || null, htmlDocRaw);

            const docPath = (block.message.mediaLibrary) ? `${sails.config.custom.mediaUrl}/${useLang}/${block.message.doc}` : block.message.doc;

            // let docRes = await sails.helpers.mgw[input.client.messenger]['docMessageJoi']({
            //   chatId: input.client.chat_id,
            //   docPath,
            //   html: htmlDoc,
            // });

            msgSaveParams = {
              msgSaveParams: {
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
              clientId: input.client.id,
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


            block.messageGuid = messageGuid;


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

          case 'doc_inline_keyboard':

            /**
             * Send document + inline keyboard message
             */

            let htmlDocInlineKeyboardRaw = await MessageProcessor.parseMessageStyle({
                client: input.client,
                message: block.message,
                additionalTokens: input.additionalTokens,
              });

            let {text: htmlDocInlineKeyboard, inline_keyboard: keyboardInlineDoc} = await activateBeforeHelper(input.client, block, input.msg || null, htmlDocInlineKeyboardRaw);

            const docInlineKeyboardPath = (block.message.mediaLibrary) ? `${sails.config.custom.mediaUrl}/${useLang}/${block.message.doc}` : block.message.doc;

            const docMessageJoiParams = {
              chatId: input.client.chat_id,
              docPath: docInlineKeyboardPath,
              html: htmlDocInlineKeyboard,
            };

            if (keyboardInlineDoc != null) {

              docMessageJoiParams.inlineKeyboard = await MessageProcessor.mapDeep({
                client: input.client,
                data: keyboardInlineDoc,
                additionalTokens: input.additionalTokens,
              });

            }

            // let docInlineKeyboardRes = await sails.helpers.mgw[input.client.messenger]['docMessageJoi'](docMessageJoiParams);

            msgSaveParams = {
              msgSaveParams: {
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
              clientId: input.client.id,
              msgType: 'docMessageJoi',
              payload: docMessageJoiParams,
            };

            await sails.helpers.storage.msgQueueCreateWrapper({
              msgQueueCreateParams,
              createdBy: moduleName,
            });

            block.messageGuid = messageGuid;


            // /**
            //  * Save the sent message
            //  */
            //
            // await sails.helpers.storage.messageSaveJoi({
            //   message_id: docInlineKeyboardRes.payload.message_id || 0,
            //   message: JSON.stringify({
            //     doc: docInlineKeyboardPath,
            //     html: htmlDocInlineKeyboard,
            //   }),
            //   message_buttons: docMessageJoiParams.inlineKeyboard,
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

            let htmlForcedRaw = await MessageProcessor.parseMessageStyle({
              client: input.client,
              message: block.message,
              additionalTokens: input.additionalTokens,
            });

            let {text: htmlForced} = await activateBeforeHelper(input.client, block, input.msg || null, htmlForcedRaw);

            // let forcedRes = await sails.helpers.mgw[input.client.messenger]['forcedMessageJoi']({
            //   chatId: input.client.chat_id,
            //   html: htmlForced,
            //   removeKeyboard: block.removeKeyboard,
            // });

            msgSaveParams = {
              msgSaveParams: {
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
              clientId: input.client.id,
              msgType: 'forcedMessageJoi',
              payload: {
                chatId: input.client.chat_id,
                html: htmlForced,
                removeKeyboard: block.removeKeyboard,
              },
            };

            await sails.helpers.storage.msgQueueCreateWrapper({
              msgQueueCreateParams,
              createdBy: moduleName,
            });


            block.messageGuid = messageGuid;


            // /**
            //  * Save the sent message
            //  */
            //
            // await sails.helpers.storage.messageSaveJoi({
            //   message_id: forcedRes.payload.message_id || 0,
            //   message: htmlForced,
            //   message_format: sails.config.custom.enums.messageFormat.FORCED,
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

            let htmlInlineRaw = await MessageProcessor.parseMessageStyle({
              client: input.client,
              message: block.message,
              additionalTokens: input.additionalTokens,
              });

            let {text: htmlInline, inline_keyboard: keyboardInline} = await activateBeforeHelper(input.client, block, input.msg || null, htmlInlineRaw);

            const inlineKeyboard = await MessageProcessor.mapDeep({
              client: input.client,
              data: keyboardInline,
              additionalTokens: input.additionalTokens,
            });


            // let inlineRes = await sails.helpers.mgw[input.client.messenger]['inlineKeyboardMessageJoi']({
            //   chatId: input.client.chat_id,
            //   html: htmlInline,
            //   inlineKeyboard,
            //   removeKeyboard: block.removeKeyboard,
            //   disableWebPagePreview,
            // });

            msgSaveParams = {
              msgSaveParams: {
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
              clientId: input.client.id,
              msgType: 'inlineKeyboardMessageJoi',
              payload: {
                chatId: input.client.chat_id,
                html: htmlInline,
                inlineKeyboard,
                removeKeyboard: block.removeKeyboard,
                disableWebPagePreview,
              },
            };

            await sails.helpers.storage.msgQueueCreateWrapper({
              msgQueueCreateParams,
              createdBy: moduleName,
            });


            block.messageGuid = messageGuid;


            // /**
            //  * Save the sent message
            //  */
            //
            // await sails.helpers.storage.messageSaveJoi({
            //   message_id: inlineRes.payload.message_id || 0,
            //   message: htmlInline,
            //   message_format: sails.config.custom.enums.messageFormat.INLINEKEYBOARD,
            //   messenger: input.client.messenger,
            //   message_originator: sails.config.custom.enums.messageOriginator.BOT,
            //   client_id: input.client.id,
            //   client_guid: input.client.guid,
            //   message_buttons: inlineKeyboard
            // });

            break;

        }

        await sails.helpers.storage.clientUpdateJoi({
          criteria: {guid: input.client.guid},
          data: {
            current_funnel: input.client.current_funnel,
            funnels: input.client.funnels,
            accounts: input.client.accounts,
            forced_reply_expected: input.client.forced_reply_expected
          },
          createdBy: `${input.createdBy} => ${moduleName}`,
        });

        /**
         * After sending message we need to perform afterHelper
         */

        if (_.isNil(block.afterHelper)) {

          /**
           * Only for simple messages (like text, img, video & doc) we perform afterHelperGeneric
           * because for both forced and inline_keyboard messages
           * we perform next actions based on the information provided by client
           */

          if (_.includes(['text', 'img', 'video', 'doc', 'sticker'], block.actionType)) {

            await sails.helpers.funnel.afterHelperGenericJoi({
              client: input.client,
              block: block,
              msg: input.msg || 'no message',
              next: true,
              previous: true,
              switchFunnel: true,
              createdBy: `${input.createdBy} => ${moduleName}`,
            });

          }

        } else {

          let splitAfterHelperRes = _.split(block.afterHelper, sails.config.custom.JUNCTION, 3);
          let afterHelperCategory = splitAfterHelperRes[0];
          let afterHelperBlock = splitAfterHelperRes[1];
          let afterHelperName = splitAfterHelperRes[2];

          if (afterHelperCategory && afterHelperBlock && afterHelperName) {

            /**
             * We managed to parse the specified afterHelper and can perform it
             */

            let afterHelperParams = {
              client: input.client,
              block: block,
            };

            if (input.msg) {

              afterHelperParams.msg = input.msg;

            }

            await sails.helpers.funnel[afterHelperCategory][afterHelperBlock][afterHelperName](afterHelperParams);


          } else {

            /**
             * Throw error: we could not parse the specified afterHelper
             */

            // throw new Error(sails.config.custom.PROCEED_NEXT_BLOCK_AFTERHELPER_PARSE_ERROR);

            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: sails.config.custom.PROCEED_NEXT_BLOCK_AFTERHELPER_PARSE_ERROR,
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.FUNNELS_ERROR.name,
              payload: {
                blockAfterHelper: block.afterHelper,
              },
            });

          }

        }

      }

      /**
       * If we have a next block specified we have to parse and proceed it
       */

      if (block.next) {

        let splitRes = _.split(block.next, sails.config.custom.JUNCTION, 2);
        let nextFunnelName = splitRes[0];
        let nextId = splitRes[1];

        if (
          nextFunnelName
          && nextId
        ) {

          if (!_.has(input.client.funnels, nextFunnelName)) {
            // throw new Error(`nextFunnel not found, \nfunnels: ${JSON.stringify(input.client.funnels, null, 3)} \n\nnextFunnel : ${input.nextFunnel}`);

            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'nextFunnel not found',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.FUNNELS_ERROR.name,
              payload: {
                blockNext: block.next,
                nextFunnelName,
                inputClientFunnels: input.client.funnels,
              },
            });

          }

          const nextFunnel = input.client.funnels[nextFunnelName];

          const nextBlock = _.find(nextFunnel, {id: nextId});

          if (_.isNil(nextBlock)) {
            // throw new Error(`next block not found, \nnextFunnelName: ${nextFunnelName} \nnextId : ${nextId}`);

            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'next block not found',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.FUNNELS_ERROR.name,
              payload: {
                nextId,
                nextFunnelName,
                nextFunnel,
              },
            });

          }

          const createdByRegexp = new RegExp(moduleName);
          const createdBy = input.createdBy.match(createdByRegexp) ? input.createdBy : `${input.createdBy} => ${moduleName}`;

          let proceedNextBlockParams = {
            client: input.client,
            funnelName: nextFunnelName,
            blockId: nextId,
            createdBy,
          };

          if (input.msg) {

            proceedNextBlockParams.msg = input.msg;

          }

          const showTime = !nextBlock.done ? nextBlock.show_time || 0 : 0;

          if (showTime > 0) {

            // sails.log(`${moduleName}, showTime > 0:
            // nextBlock.id: ${nextBlock.id}
            // nextBlock.shown: ${nextBlock.shown}
            // nextBlock.done: ${nextBlock.done}
            // nextBlock.show_time: ${nextBlock.show_time}`);

            await sleep(showTime);
            await sails.helpers.funnel.proceedNextBlockJoi(proceedNextBlockParams);

          } else {

            await sails.helpers.funnel.proceedNextBlockJoi(proceedNextBlockParams);

          }

        }

      }

    } catch (e) {

      // const errorLocation = moduleName;
      // const errorMsg = `${moduleName}: ${sails.config.custom.PROCEED_NEXT_BLOCK_JOI_ERROR}`;
      //
      // sails.log.error(errorLocation + ', error: ' + errorMsg);
      // sails.log.error(errorLocation + ', error details: ', e);
      //
      // throw {err: {
      //     module: errorLocation,
      //     message: errorMsg,
      //     payload: {
      //       error: e,
      //     },
      //   }
      // };

      // return await sails.helpers.general.catchErrorJoi({
      //   error: e,
      //   location: moduleName,
      //   throwError,
      // });

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

    return exits.success({
      status: 'ok',
      message: 'Success',
      payload: {
        client: input.client,
        block: block
      }
    });

  }

};

async function activateBeforeHelper(client, block, msg, htmlMsg) {

  let res = {
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
        block: block,
        payload: res,
      };

      if (msg) {

        beforeHelperParams.msg = msg;

      }

      res = await sails.helpers.funnel[beforeHelperCategory][beforeHelperBlock][beforeHelperName](beforeHelperParams);

    } else {

      /**
       * Throw error: we could not parse the specified beforeHelper
       */

      // throw new Error(sails.config.custom.PROCEED_NEXT_BLOCK_BEFOREHELPER_PARSE_ERROR);

      await sails.helpers.general.throwErrorJoi({
        errorType: sails.config.custom.enums.errorType.CRITICAL,
        emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
        location: moduleName,
        message: sails.config.custom.PROCEED_NEXT_BLOCK_BEFOREHELPER_PARSE_ERROR,
        clientGuid: client.guid,
        accountGuid: client.account_use,
        errorName: sails.config.custom.FUNNELS_ERROR.name,
        payload: {
          blockBeforeHelper: block.beforeHelper,
        },
      });

    }

  }

  return res;

}

async function activateBlockModifyHelper(client, block) {

  let res = block;

  if (!_.isNil(block.blockModifyHelper)) {

    let splitBlockModifyHelperRes = _.split(block.blockModifyHelper, sails.config.custom.JUNCTION, 3);
    let blockModifyHelperCategory = splitBlockModifyHelperRes[0];
    let blockModifyHelperBlock = splitBlockModifyHelperRes[1];
    let blockModifyHelperName = splitBlockModifyHelperRes[2];

    if (blockModifyHelperCategory && blockModifyHelperBlock && blockModifyHelperName) {

      /**
       * We managed to parse the specified blockModifyHelper and can perform it
       */

      let blockModifyHelperParams = {
        client: client,
        block: block,
      };

      res = await sails.helpers.funnel[blockModifyHelperCategory][blockModifyHelperBlock][blockModifyHelperName](blockModifyHelperParams);

    } else {

      /**
       * Throw error: we could not parse the specified blockModifyHelper
       */

      // throw new Error(sails.config.custom.PROCEED_NEXT_BLOCK_BLOCKMODIFYEHELPER_PARSE_ERROR);

      await sails.helpers.general.throwErrorJoi({
        errorType: sails.config.custom.enums.errorType.CRITICAL,
        emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
        location: moduleName,
        message: sails.config.custom.PROCEED_NEXT_BLOCK_BLOCKMODIFYEHELPER_PARSE_ERROR,
        clientGuid: client.guid,
        accountGuid: client.account_use,
        errorName: sails.config.custom.FUNNELS_ERROR.name,
        payload: {
          blockBlockModifyHelper: block.blockModifyHelper,
        },
      });

    }

  }

  return res;

}


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
    });

    let block = null;
    let funnel = null;
    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      if (!_.has(input.client.funnels, input.funnelName)) {
        throw new Error(`funnel not found, \nfunnels: ${JSON.stringify(input.client.funnels, null, 3)} \n\nfunnelName : ${input.funnelName}`);
      }

      funnel = input.client.funnels[input.funnelName];

      block = _.find(funnel, {id: input.blockId});

      if (_.isNil(block)) {
        throw new Error(`block not found, \nfunnelName: ${input.funnelName} \nblockId : ${input.blockId}`);
      }

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
          clientGuid: input.client.guid,
          accountGuid: input.client.account_use,
          funnelName: input.funnelName,
          blockId: input.blockId,
        });

        /**
         * Call blockModifyHelper to update block if needed
         */

        block = await activateBlockModifyHelper(input.client, block);

        switch (block.actionType) {

          case 'text':

            /**
             * Send simple text message
             */

            let htmlSimpleRaw = MessageProcessor.parseMessageStyle({
                client: input.client,
                message: block.message,
                additionalTokens: input.additionalTokens,
              });

            let {text: htmlSimple} = await activateBeforeHelper(input.client, block, input.msg || null, htmlSimpleRaw);

            let simpleRes = await sails.helpers.mgw[input.client.messenger]['simpleMessageJoi']({
              chatId: input.client.chat_id,
              html: htmlSimple,
              removeKeyboard: block.removeKeyboard,
            });

            block.message_id = simpleRes.payload.message_id;

            block.shown = true;

            /**
             * Save the sent message
             */

            await sails.helpers.storage.messageSaveJoi({
              message_id: simpleRes.payload.message_id || 0,
              message: htmlSimple,
              message_format: sails.config.custom.enums.messageFormat.SIMPLE,
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

            let htmlImgRaw = MessageProcessor.parseMessageStyle({
              client: input.client,
              message: block.message,
              additionalTokens: input.additionalTokens,
            });

            let {text: htmlImg} = await activateBeforeHelper(input.client, block, input.msg || null, htmlImgRaw);

            let imgRes = await sails.helpers.mgw[input.client.messenger]['imgMessageJoi']({
              chatId: input.client.chat_id,
              imgPath: sails.config.custom.cloudinaryImgUrl + block.message.img,
              html: htmlImg,
            });

            block.message_id = imgRes.payload.message_id;

            block.shown = true;

            /**
             * Save the sent message
             */

            await sails.helpers.storage.messageSaveJoi({
              message_id: imgRes.payload.message_id || 0,
              message: JSON.stringify({
                img: sails.config.custom.cloudinaryImgUrl + block.message.img,
                html: htmlImg,
              }),
              message_format: sails.config.custom.enums.messageFormat.IMG,
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

            let htmlVideoRaw = MessageProcessor.parseMessageStyle({
              client: input.client,
              message: block.message,
              additionalTokens: input.additionalTokens,
            });

            let {text: htmlVideo} = await activateBeforeHelper(input.client, block, input.msg || null, htmlVideoRaw);

            let videoRes = await sails.helpers.mgw[input.client.messenger]['videoMessageJoi']({
              chatId: input.client.chat_id,
              videoPath: sails.config.custom.cloudinaryVideoUrl + block.message.video,
              html: htmlVideo,
            });

            block.message_id = videoRes.payload.message_id;

            block.shown = true;

            /**
             * Save the sent message
             */

            await sails.helpers.storage.messageSaveJoi({
              message_id: videoRes.payload.message_id || 0,
              message: JSON.stringify({
                video: sails.config.custom.cloudinaryVideoUrl + block.message.video,
                html: htmlVideo,
              }),
              message_format: sails.config.custom.enums.messageFormat.VIDEO,
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

            let stickerRes = await sails.helpers.mgw[input.client.messenger]['stickerMessageJoi']({
              chatId: input.client.chat_id,
              stickerPath: sails.config.custom.cloudinaryImgUrl + block.message.sticker,
            });

            block.message_id = stickerRes.payload.message_id;

            block.shown = true;

            /**
             * Save the sent message
             */

            await sails.helpers.storage.messageSaveJoi({
              message_id: stickerRes.payload.message_id || 0,
              message: JSON.stringify({
                sticker: sails.config.custom.cloudinaryImgUrl + block.message.sticker,
              }),
              message_format: sails.config.custom.enums.messageFormat.STICKER,
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

            let htmlDocRaw = MessageProcessor.parseMessageStyle({
                client: input.client,
                message: block.message,
                additionalTokens: input.additionalTokens,
              });

            let {text: htmlDoc} = await activateBeforeHelper(input.client, block, input.msg || null, htmlDocRaw);

            let docRes = await sails.helpers.mgw[input.client.messenger]['docMessageJoi']({
              chatId: input.client.chat_id,
              docPath: sails.config.custom.cloudinaryDocUrl + block.message.doc,
              html: htmlDoc,
            });

            block.message_id = docRes.payload.message_id;

            block.shown = true;

            /**
             * Save the sent message
             */

            await sails.helpers.storage.messageSaveJoi({
              message_id: docRes.payload.message_id || 0,
              message: JSON.stringify({
                doc: sails.config.custom.cloudinaryDocUrl + block.message.doc,
                html: htmlDoc,
              }),
              message_format: sails.config.custom.enums.messageFormat.DOC,
              messenger: input.client.messenger,
              message_originator: sails.config.custom.enums.messageOriginator.BOT,
              client_id: input.client.id,
              client_guid: input.client.guid
            });

            break;

          case 'doc_inline_keyboard':

            /**
             * Send document + inline keyboard message
             */

            let htmlDocInlineKeyboardRaw = MessageProcessor.parseMessageStyle({
                client: input.client,
                message: block.message,
                additionalTokens: input.additionalTokens,
              });

            let {text: htmlDocInlineKeyboard, inline_keyboard: keyboardInlineDoc} = await activateBeforeHelper(input.client, block, input.msg || null, htmlDocInlineKeyboardRaw);

            const docMessageJoiParams = {
              chatId: input.client.chat_id,
              docPath: sails.config.custom.cloudinaryDocUrl + block.message.doc,
              html: htmlDocInlineKeyboard,
            };

            if (keyboardInlineDoc != null) {

              docMessageJoiParams.inlineKeyboard = MessageProcessor.mapDeep({
                client: input.client,
                data: keyboardInlineDoc,
                additionalTokens: input.additionalTokens,
              });

            }

            let docInlineKeyboardRes = await sails.helpers.mgw[input.client.messenger]['docMessageJoi'](docMessageJoiParams);

            block.message_id = docInlineKeyboardRes.payload.message_id;

            block.shown = true;

            /**
             * Save the sent message
             */

            await sails.helpers.storage.messageSaveJoi({
              message_id: docInlineKeyboardRes.payload.message_id || 0,
              message: JSON.stringify({
                doc: sails.config.custom.cloudinaryDocUrl + block.message.doc,
                html: htmlDocInlineKeyboard,
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

            let htmlForcedRaw = MessageProcessor.parseMessageStyle({
              client: input.client,
              message: block.message,
              additionalTokens: input.additionalTokens,
            });

            let {text: htmlForced} = await activateBeforeHelper(input.client, block, input.msg || null, htmlForcedRaw);

            let forcedRes = await sails.helpers.mgw[input.client.messenger]['forcedMessageJoi']({
              chatId: input.client.chat_id,
              html: htmlForced,
              removeKeyboard: block.removeKeyboard,
            });

            block.message_id = forcedRes.payload.message_id;

            block.shown = true;

            /**
             * Save the sent message
             */

            await sails.helpers.storage.messageSaveJoi({
              message_id: forcedRes.payload.message_id || 0,
              message: htmlForced,
              message_format: sails.config.custom.enums.messageFormat.FORCED,
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

            let htmlInlineRaw = MessageProcessor.parseMessageStyle({
              client: input.client,
              message: block.message,
              additionalTokens: input.additionalTokens,
              });

            let {text: htmlInline, inline_keyboard: keyboardInline} = await activateBeforeHelper(input.client, block, input.msg || null, htmlInlineRaw);

            const inlineKeyboard = MessageProcessor.mapDeep({
              client: input.client,
              data: keyboardInline,
              additionalTokens: input.additionalTokens,
            });


            let inlineRes = await sails.helpers.mgw[input.client.messenger]['inlineKeyboardMessageJoi']({
              chatId: input.client.chat_id,
              html: htmlInline,
              inlineKeyboard,
              removeKeyboard: block.removeKeyboard,
            });

            block.message_id = inlineRes.payload.message_id;

            block.shown = true;

            /**
             * Save the sent message
             */

            await sails.helpers.storage.messageSaveJoi({
              message_id: inlineRes.payload.message_id || 0,
              message: htmlInline,
              message_format: sails.config.custom.enums.messageFormat.CALLBACK,
              messenger: input.client.messenger,
              message_originator: sails.config.custom.enums.messageOriginator.BOT,
              client_id: input.client.id,
              client_guid: input.client.guid,
              message_buttons: inlineKeyboard
            });

            break;

        }

        await sails.helpers.storage.clientUpdateJoi({
          criteria: {guid: input.client.guid},
          data: {
            current_funnel: input.client.current_funnel,
            // funnels: funnel,
            funnels: input.client.funnels,
            accounts: input.client.accounts,
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

          let splitAfterHelperRes = _.split(block.afterHelper, sails.config.custom.JUNCTION, 2);
          let afterHelperBlock = splitAfterHelperRes[0];
          let afterHelperName = splitAfterHelperRes[1];

          if (afterHelperBlock && afterHelperName) {

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

            await sails.helpers.funnel[input.client.funnel_name][afterHelperBlock][afterHelperName](afterHelperParams);


          } else {

            /**
             * Throw error: we could not parse the specified afterHelper
             */

            throw new Error(sails.config.custom.PROCEED_NEXT_BLOCK_AFTERHELPER_PARSE_ERROR);
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
            throw new Error(`nextFunnel not found, \nfunnels: ${JSON.stringify(input.client.funnels, null, 3)} \n\nnextFunnel : ${input.nextFunnel}`);
          }

          const nextFunnel = input.client.funnels[nextFunnelName];

          const nextBlock = _.find(nextFunnel, {id: nextId});

          if (_.isNil(nextBlock)) {
            throw new Error(`next block not found, \nnextFunnelName: ${nextFunnelName} \nnextId : ${nextId}`);
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

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: ${sails.config.custom.PROCEED_NEXT_BLOCK_JOI_ERROR}`;

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
  };

  if (!_.isNil(block.beforeHelper)) {

    let splitBeforeHelperRes = _.split(block.beforeHelper, sails.config.custom.JUNCTION, 2);
    let beforeHelperBlock = splitBeforeHelperRes[0];
    let beforeHelperName = splitBeforeHelperRes[1];

    if (beforeHelperBlock && beforeHelperName) {

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

      res = await sails.helpers.funnel[client.funnel_name][beforeHelperBlock][beforeHelperName](beforeHelperParams);

    } else {

      /**
       * Throw error: we could not parse the specified beforeHelper
       */

      throw new Error(sails.config.custom.PROCEED_NEXT_BLOCK_BEFOREHELPER_PARSE_ERROR);

    }

  }

  return res;

}

async function activateBlockModifyHelper(client, block) {

  let res = block;

  if (!_.isNil(block.blockModifyHelper)) {

    let splitBlockModifyHelperRes = _.split(block.blockModifyHelper, sails.config.custom.JUNCTION, 2);
    let blockModifyHelperBlock = splitBlockModifyHelperRes[0];
    let blockModifyHelperName = splitBlockModifyHelperRes[1];

    if (blockModifyHelperBlock && blockModifyHelperName) {

      /**
       * We managed to parse the specified blockModifyHelper and can perform it
       */

      let blockModifyHelperParams = {
        client: client,
        block: block,
      };

      res = await sails.helpers.funnel[client.funnel_name][blockModifyHelperBlock][blockModifyHelperName](blockModifyHelperParams);

    } else {

      /**
       * Throw error: we could not parse the specified blockModifyHelper
       */

      throw new Error(sails.config.custom.PROCEED_NEXT_BLOCK_BLOCKMODIFYEHELPER_PARSE_ERROR);

    }

  }

  return res;

}


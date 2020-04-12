"use strict";

const Joi = require('@hapi/joi');
const sleep = require('util').promisify(setTimeout);

const moduleName = 'funnel:proceed-next-block-joi';

const t = require('../../services/translate').t;
const confObj = require('../../services/translate').getConfigObj;
const emoji = require('node-emoji');



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






    msg: {
      friendlyName: 'message',
      description: 'Message received',
      type: 'ref',
      // required: true,
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
      msg: Joi
        .any()
        .description('Message received'),
    });


    let block = null;
    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      // sails.log.info('/*************** api/helpers/funnel/proceed-next-block ***************/');
      // sails.log.debug('input.funnelName: ', input.funnelName);
      // sails.log.debug('input.blockId: ', input.blockId);


      let clientName = {
        firstName: input.client.first_name || null,
        lastName: input.client.last_name || null,
      };

      block = _.find(input.client.funnels[input.funnelName], {id: input.blockId});

      if (_.isNil(block)) {
        throw new Error(`block was not found, \nfunnelName: ${input.funnelName} \nblockId : ${input.blockId}`);
      }

      if (
        block.enabled
        // && !block.shown
        && !block.done
        && block.actionType
      ) {

        /**
         * Call blockModifyHelper to update block if needed
         */

        block = await activateBlockModifyHelper(input.client, block);

        switch (block.actionType) {

          case 'text':

            /**
             * Send simple text message
             */

            let htmlSimpleRaw = parseMessageStyle(input.client, clientName, block.message, input.client.lang);

            let {text: htmlSimple} = await activateBeforeHelper(input.client, block, input.msg || null, htmlSimpleRaw);

            // sails.log.debug('htmlSimple: ', htmlSimple);

            let simpleRes = await sails.helpers.mgw[input.client.messenger]['simpleMessage'].with({
              chatId: input.client.chat_id,
              html: htmlSimple,
            });

            // sails.log.debug('simpleRes: ', simpleRes);
            // sails.log.debug('simpleRes payload: ', simpleRes.payload);

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

            let htmlImgRaw = parseMessageStyle(input.client, clientName, block.message, input.client.lang);

            let {text: htmlImg} = await activateBeforeHelper(input.client, block, input.msg || null, htmlImgRaw);

            let imgRes = await sails.helpers.mgw[input.client.messenger]['imgMessage'].with({
              chatId: input.client.chat_id,
              imgPath: sails.config.custom.cloudinaryImgUrl + block.message.img,
              html: htmlImg,
            });

            // sails.log.debug('imgRes: ', imgRes);
            // sails.log.debug('imgRes payload: ', imgRes.payload);

            block.message_id = imgRes.payload.message_id;

            block.shown = true;

            /**
             * Save the sent message
             */

            await sails.helpers.storage.messageSave.with({
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

            let htmlVideoRaw = parseMessageStyle(input.client, clientName, block.message, input.client.lang);

            let {text: htmlVideo} = await activateBeforeHelper(input.client, block, input.msg || null, htmlVideoRaw);

            let videoRes = await sails.helpers.mgw[input.client.messenger]['videoMessage'].with({
              chatId: input.client.chat_id,
              videoPath: sails.config.custom.cloudinaryVideoUrl + block.message.video,
              html: htmlVideo,
            });

            // sails.log.debug('videoRes: ', videoRes);
            // sails.log.debug('videoRes payload: ', videoRes.payload);

            block.message_id = videoRes.payload.message_id;

            block.shown = true;

            /**
             * Save the sent message
             */

            await sails.helpers.storage.messageSave.with({
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

          case 'forced':

            /**
             * Send forced reply message
             */

            let htmlForcedRaw = parseMessageStyle(input.client, clientName, block.message, input.client.lang);

            let {text: htmlForced} = await activateBeforeHelper(input.client, block, input.msg || null, htmlForcedRaw);

            let forcedRes = await sails.helpers.mgw[input.client.messenger]['forcedMessage'].with({
              chatId: input.client.chat_id,
              html: htmlForced,
            });

            // sails.log.debug('forcedRes: ', forcedRes);
            // sails.log.debug('forcedRes payload: ', forcedRes.payload);

            block.message_id = forcedRes.payload.message_id;

            block.shown = true;

            /**
             * Save the sent message
             */

            await sails.helpers.storage.messageSave.with({
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

            let htmlInlineRaw = parseMessageStyle(input.client, clientName, block.message, input.client.lang);

            let {text: htmlInline, inline_keyboard: keyboardInline} = await activateBeforeHelper(input.client, block, input.msg || null, htmlInlineRaw);

            let objAfter = mapDeep(input.client, clientName, input.client.lang, keyboardInline);

            // sails.log.debug('objAfter: ');
            // console.dir(objAfter);

            let inlineRes = await sails.helpers.mgw[input.client.messenger]['inlineKeyboardMessage'].with({
              chatId: input.client.chat_id,
              html: htmlInline,
              inlineKeyboard: objAfter,
            });

            // sails.log.debug('inlineRes: ', inlineRes);
            // sails.log.debug('inlineRes payload: ', inlineRes.payload);

            block.message_id = inlineRes.payload.message_id;

            block.shown = true;

            /**
             * Save the sent message
             */

            await sails.helpers.storage.messageSave.with({
              message_id: inlineRes.payload.message_id || 0,
              message: htmlInline,
              message_format: sails.config.custom.enums.messageFormat.CALLBACK,
              messenger: input.client.messenger,
              message_originator: sails.config.custom.enums.messageOriginator.BOT,
              client_id: input.client.id,
              client_guid: input.client.guid,
              message_buttons: objAfter
            });

            break;


        }

        // await sails.helpers.storage.clientUpdate.with({
        //   criteria: {guid: input.client.guid},
        //   data: {
        //     current_funnel: input.client.current_funnel,
        //     funnels: input.client.funnels,
        //     accounts: input.client.accounts,
        //   }
        // });


      }

      /**
       * After sending message we need to perform afterHelper
       */

      if (_.isNil(block.afterHelper)) {

        /**
         * Only for simple text or img messages we perform afterHelperGeneric
         * because for both forced and inline_keyboard messages
         * we perform next actions based on the information provided by client
         */

        // TODO: Добавить сюда другие типы сообщений: video, doc

        if (_.includes(['text', 'img'], block.actionType)) {

          await sails.helpers.funnel.afterHelperGeneric.with({
            client: input.client,
            block: block,
            msg: input.msg || 'no message',
            next: true,
            previous: true,
            switchFunnel: true,
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

          await sails.helpers.funnel[input.client.funnel_name][afterHelperBlock][afterHelperName].with(afterHelperParams);


        } else {

          /**
           * Throw error: we could not parse the specified afterHelper
           */

          throw new Error(sails.config.custom.PROCEED_NEXT_BLOCK_AFTERHELPER_PARSE_ERROR);
        }

      }

      /**
       * If we have a next block specified we have to parse and proceed it
       */

      if (block.next) {

        let splitRes = _.split(block.next, sails.config.custom.JUNCTION, 2);
        let nextFunnel = splitRes[0];
        let nextId = splitRes[1];

        // sails.log.debug('nextFunnel: ', nextFunnel);
        // sails.log.debug('nextId: ', nextId);

        if (
          nextFunnel
          && nextId
        ) {

          const nextBlock = _.find(input.client.funnels[nextFunnel], {id: nextId});

          if (_.isNil(nextBlock)) {
            throw new Error(`next block not found, \nnextFunnel: ${nextFunnel} \nnextId : ${nextId}`);
          }

          let proceedNextBlockParams = {
            client: input.client,
            funnelName: nextFunnel,
            blockId: nextId,
          };

          if (input.msg) {

            proceedNextBlockParams.msg = input.msg;

          }

          const showTime = nextBlock.show_time || 0;

          if (showTime > 0) {

            await sleep(showTime);
            await sails.helpers.funnel.proceedNextBlockJoi(proceedNextBlockParams);

          } else {

            await sails.helpers.funnel.proceedNextBlockJoi(proceedNextBlockParams);

          }

        }

      }

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: ${sails.config.custom.PROCEED_NEXT_BLOCK_ERROR}`;

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

    return exits.success({status: 'ok',
      message: 'Success',
      payload: {
        client: input.client,
        block: block
      }});

  }

};

function mapDeep(clientRec, clientName, lang, obj) {
  if (_.isArray(obj)) {
    let arr = obj.map(innerObj => mapDeep(clientRec, clientName, lang, innerObj));

    // sails.log.info('mapDeep, arr: ', arr);

    return arr;
  } else if (_.isObject(obj)) {
    let ob = _.forEach(obj, (val, key, o) => {
      if (key == 'text') {
        // o[key] = t(lang, val);
        o[key] = parseSpecialTokens(clientRec, clientName, t(lang, val), lang) ;
      }
      // return o;
    });

    // sails.log.info('mapDeep, ob: ', ob);

    return ob;
  }
}

function parseSpecialTokens(clientRec, clientName, msg, lang) {

  let resultStr = msg;

  const firstName = clientName.firstName || '';
  const lastName = clientName.lastName || '';

  const configPricePlatinum = confObj(lang).price.platinum;
  const configPriceGold = confObj(lang).price.gold;
  const configPriceBronze = confObj(lang).price.bronze;

  let mandatoryProfileList = '';

  for (let i = 0; i < confObj(lang).profiles.length; i++) {

    mandatoryProfileList = mandatoryProfileList + `<a href="${confObj(lang).profiles[i].url}">${confObj(lang).profiles[i].text}</a>` + sails.config.custom.SCR;

  }

  mandatoryProfileList = mandatoryProfileList + sails.config.custom.DCR;


  resultStr = _.replace(resultStr, '$FirstName$', firstName);
  resultStr = _.replace(resultStr, '$LastName$', lastName);

  resultStr = _.replace(resultStr, '$PricePlatinum$', `${configPricePlatinum.text}: ${configPricePlatinum.value_text} ${configPricePlatinum.currency_text}/${configPricePlatinum.period_text}`);
  resultStr = _.replace(resultStr, '$PriceGold$', `${configPriceGold.text}: ${configPriceGold.value_text} ${configPriceGold.currency_text}/${configPriceGold.period_text}`);
  resultStr = _.replace(resultStr, '$PriceBronze$', `${configPriceBronze.text}: ${configPriceBronze.value_text} ${configPriceBronze.currency_text}/${configPriceBronze.period_text}`);

  resultStr = _.replace(resultStr, '$NamePlatinum$', `${configPricePlatinum.text}`);
  resultStr = _.replace(resultStr, '$NameGold$', `${configPriceGold.text}`);
  resultStr = _.replace(resultStr, '$NameBronze$', `${configPriceBronze.text}`);

  resultStr = _.replace(resultStr, '$MandatoryProfiles$', mandatoryProfileList);

  // sails.log.warn('clientRec.accounts: ', clientRec.accounts);
  const currentAccount = _.find(clientRec.accounts, {guid: clientRec.account_use});
  // sails.log.warn('currentAccount: ', currentAccount);
  const profileOfCurrentAccount = currentAccount.inst_profile;
  // sails.log.warn('profileOfCurrentAccount: ', profileOfCurrentAccount);
  resultStr = _.replace(resultStr, '$CurrentAccount$', profileOfCurrentAccount);

  /**
   * Кол-во сообщений, отправленных с текущего аккаунта за сутки
   */

  const numberOfMessagesSentToday = currentAccount.posts_made_day;
  resultStr = _.replace(resultStr, '$PostsSent$', numberOfMessagesSentToday);

  resultStr = emoji.emojify(resultStr, () => '');

  return resultStr;
}

function parseMessageStyle(clientRec, clientName, msg, lang) {
  let resultHtml = '';

  for (let i = 0; i < msg.html.length; i++) {
    resultHtml = resultHtml +
      (/b/i.test(msg.html[i].style) ? '<b>' : '') +
      (/i/i.test(msg.html[i].style) ? '<i>' : '') +
      (/url/i.test(msg.html[i].style) ? `<a href="${msg.html[i].url}">` : '') +
      t(lang, msg.html[i].text) +
      (/i/i.test(msg.html[i].style) ? '</i>' : '') +
      (/b/i.test(msg.html[i].style) ? '</b>' : '') +
      (/url/i.test(msg.html[i].style) ? '</a>' : '') +
      (msg.html.length > 1
        ? (msg.html[i].cr
          ? sails.config.custom[msg.html[i].cr]
          : '')
        : '');
  }

  // sails.log.warn('resultHtml, before:', resultHtml);

  resultHtml = parseSpecialTokens(clientRec, clientName, resultHtml, lang);

  // sails.log.warn('resultHtml, after:', resultHtml);


  return resultHtml;
}

async function activateBeforeHelper(client, block, msg, htmlMsg) {

  let res = {
    text: htmlMsg,
    inline_keyboard: block.message.inline_keyboard,
  };

  // sails.log.warn('client:', client);
  // sails.log.warn('block:', block);
  // sails.log.warn('msg:', msg);
  // sails.log.warn('htmlMsg:', htmlMsg);

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

      res = await sails.helpers.funnel[client.funnel_name][beforeHelperBlock][beforeHelperName].with(beforeHelperParams);

    } else {

      /**
       * Throw error: we could not parse the specified beforeHelper
       */

      const errorLocation = 'api/helpers/funnel/proceed-next-block';
      const errorMsg = sails.config.custom.PROCEED_NEXT_BLOCK_BEFOREHELPER_PARSE_ERROR;

      sails.log.error(errorLocation + ', error: ' + errorMsg);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
        }
      };
    }

  }

  return res;

}

async function activateBlockModifyHelper(client, block) {

  let res = block;

  // sails.log.warn('client:', client);
  // sails.log.warn('block:', block);
  // sails.log.warn('msg:', msg);
  // sails.log.warn('htmlMsg:', htmlMsg);

  if (!_.isNil(block.blockModifyHelper)) {

    let splitBlockModifyHelperRes = _.split(block.blockModifyHelper, sails.config.custom.JUNCTION, 2);
    let blockModifyHelperBlock = splitBlockModifyHelperRes[0];
    let blockModifyHelperName = splitBlockModifyHelperRes[1];

    if (blockModifyHelperBlock && blockModifyHelperName) {

      /**
       * We managed to parse the specified blockModifyHelper and can perform it
       */

      let beforeHelperParams = {
        client: client,
        block: block,
      };

      res = await sails.helpers.funnel[client.funnel_name][blockModifyHelperBlock][blockModifyHelperName].with(beforeHelperParams);

    } else {

      /**
       * Throw error: we could not parse the specified blockModifyHelper
       */

      const errorLocation = 'api/helpers/funnel/proceed-next-block';
      const errorMsg = sails.config.custom.PROCEED_NEXT_BLOCK_BLOCKMODIFYEHELPER_PARSE_ERROR;

      sails.log.error(errorLocation + ', error: ' + errorMsg);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
        }
      };
    }

  }

  return res;

}


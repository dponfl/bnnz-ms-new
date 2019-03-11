"use strict";

const _ = require('lodash');

const t = require('../../services/translate').t;



module.exports = {


  friendlyName: 'Proceed next block',


  description: '',


  inputs: {
    client: {
      friendlyName: 'Client',
      description: 'Client record',
      type: 'ref',
      required: true,
    },
    funnelName: {
      friendlyName: 'FunnelName',
      description: 'Funnel name',
      type: 'string',
      required: true,
    },
    blockId: {
      friendlyName: 'Block ID',
      description: 'Funnel block id',
      type: 'string',
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

    let block = null;

    try {

      let clientName = {
        firstName: inputs.client.first_name || null,
        lastName: inputs.client.last_name || null,
      };

      block = _.find(inputs.client.funnels[inputs.funnelName], {id: inputs.blockId});

      if (
        block.enabled
        // && !block.shown
        && !block.done
        && block.actionType
      ) {

        switch (block.actionType) {

          case 'text':

            /**
             * Send simple text message
             */

            let htmlSimpleRaw = parseMessageStyle(clientName, block.message, inputs.client.lang);

            let htmlSimple = await activateBeforeHelper(inputs.client, block, inputs.msg || null, htmlSimpleRaw);

            sails.log.debug('htmlSimple: ', htmlSimple);

            let simpleRes = await sails.helpers.mgw[inputs.client.messenger]['simpleMessage'].with({
              chatId: inputs.client.chat_id,
              html: htmlSimple,
            });

            sails.log.debug('simpleRes: ', simpleRes);
            sails.log.debug('simpleRes payload: ', simpleRes.payload);

            block.message_id = simpleRes.payload.message_id;

            block.shown = true;

            /**
             * Save the sent message
             */

            await sails.helpers.storage.messageSave.with({
              message: htmlSimple,
              message_format: 'simple',
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

            let htmlImgRaw = parseMessageStyle(clientName, block.message, inputs.client.lang);

            let htmlImg = await activateBeforeHelper(inputs.client, block, inputs.msg || null, htmlImgRaw);

            let imgRes = await sails.helpers.mgw[inputs.client.messenger]['imgMessage'].with({
              chatId: inputs.client.chat_id,
              imgPath: sails.config.custom.cloudinaryImgUrl + block.message.img,
              html: htmlImg,
            });

            sails.log.debug('imgRes: ', imgRes);
            sails.log.debug('imgRes payload: ', imgRes.payload);

            block.message_id = imgRes.payload.message_id;

            block.shown = true;

            /**
             * Save the sent message
             */

            await sails.helpers.storage.messageSave.with({
              message: JSON.stringify({
                img: sails.config.custom.cloudinaryImgUrl + block.message.img,
                html: htmlImg,
              }),
              message_format: 'img',
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

            let htmlForcedRaw = parseMessageStyle(clientName, block.message, inputs.client.lang);

            let htmlForced = await activateBeforeHelper(inputs.client, block, inputs.msg || null, htmlForcedRaw);

            let forcedRes = await sails.helpers.mgw[inputs.client.messenger]['forcedMessage'].with({
              chatId: inputs.client.chat_id,
              html: htmlForced,
            });

            sails.log.debug('forcedRes: ', forcedRes);
            sails.log.debug('forcedRes payload: ', forcedRes.payload);

            block.message_id = forcedRes.payload.message_id;

            block.shown = true;

            /**
             * Save the sent message
             */

            await sails.helpers.storage.messageSave.with({
              message: htmlForced,
              message_format: 'forced',
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

            let htmlInlineRaw = parseMessageStyle(clientName, block.message, inputs.client.lang);

            let htmlInline = await activateBeforeHelper(inputs.client, block, inputs.msg || null, htmlInlineRaw);

            let objBefore = block.message.inline_keyboard;

            let objAfter = mapDeep(inputs.client.lang, objBefore);

            // sails.log.debug('objAfter: ');
            // console.dir(objAfter);

            let inlineRes = await sails.helpers.mgw[inputs.client.messenger]['inlineKeyboardMessage'].with({
              chatId: inputs.client.chat_id,
              html: htmlInline,
              inlineKeyboard: objAfter,
            });

            sails.log.debug('inlineRes: ', inlineRes);
            sails.log.debug('inlineRes payload: ', inlineRes.payload);

            block.message_id = inlineRes.payload.message_id;

            block.shown = true;

            /**
             * Save the sent message
             */

            await sails.helpers.storage.messageSave.with({
              message: htmlInline,
              message_format: 'callback',
              messenger: inputs.client.messenger,
              message_originator: 'bot',
              client_id: inputs.client.id,
              client_guid: inputs.client.guid,
              message_buttons: objAfter
            });

            break;


        }

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

        if (_.includes(['text', 'img'], block.actionType)) {

          await sails.helpers.funnel.afterHelperGeneric.with({
            client: inputs.client,
            block: block,
            msg: inputs.msg || 'no message',
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
            client: inputs.client,
            block: block,
          };

          if (inputs.msg) {

            afterHelperParams.msg = inputs.msg;

          }

          await sails.helpers.funnel[afterHelperBlock][afterHelperName].with(afterHelperParams);


        } else {

          /**
           * Throw error: we could not parse the specified afterHelper
           */

          throw {err: {
              module: 'api/helpers/funnel/proceed-next-block',
              message: sails.config.custom.PROCEED_NEXT_BLOCK_AFTERHELPER_PARSE_ERROR,
              payload: {
                params: inputs,
                helperName: block.afterHelper,
                afterHelperBlock: afterHelperBlock,
                afterHelperName: afterHelperName,
              }
            }
          };

        }

      }

      /**
       * If we have a next block specified we have to parse and proceed it
       */

      if (block.next) {

        let splitRes = _.split(block.next, sails.config.custom.JUNCTION, 2);
        let nextFunnel = splitRes[0];
        let nextId = splitRes[1];

        sails.log.debug('nextFunnel: ', nextFunnel);
        sails.log.debug('nextId: ', nextId);

        if (
          nextFunnel
          && nextId
        ) {

          let proceedNextBlockParams = {
            client: inputs.client,
            funnelName: nextFunnel,
            blockId: nextId,
          };

          if (inputs.msg) {

            proceedNextBlockParams.msg = inputs.msg;

          }

          await sails.helpers.funnel.proceedNextBlock.with(proceedNextBlockParams);

        }

      }

    } catch (e) {

      sails.log.error('api/helpers/funnel/proceed-next-block, error: ', e);

      throw {err: {
          module: 'api/helpers/funnel/proceed-next-block',
          message: sails.config.custom.PROCEED_NEXT_BLOCK_ERROR,
          payload: {
            params: inputs,
            error: {
              name: e.name || 'no error name',
              message: e.message || 'no error message',
              stack: e.stack || 'no error stack',
              code: e.code || 'no error code',
            }
          }
        }
      };

    }

    return exits.success({status: 'ok',
      message: 'Success',
      payload: {
        client: inputs.client,
        block: block
      }});

  }

};

function mapDeep(lang, obj) {
  if (_.isArray(obj)) {
    let arr = obj.map(innerObj => mapDeep(lang, innerObj));

    // sails.log.info('mapDeep, arr: ', arr);

    return arr;
  } else if (_.isObject(obj)) {
    let ob = _.forEach(obj, (val, key, o) => {
      if (key == 'text') {
        o[key] = t(lang, val);
      }
      // return o;
    });

    // sails.log.info('mapDeep, ob: ', ob);

    return ob;
  }
}

function parseMessageStyle(clientName, msg, lang) {
  let resultHtml = '';
  let firstName = clientName.firstName || '';
  let lastName = clientName.lastName || '';

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

  sails.log.warn('resultHtml, before:', resultHtml);

  resultHtml = _.replace(resultHtml, '$firstName$', firstName);
  resultHtml = _.replace(resultHtml, '$lastName$', lastName);

  sails.log.warn('resultHtml, after:', resultHtml);


  return resultHtml;
}

async function activateBeforeHelper(client, block, msg, htmlMsg) {

  let res = htmlMsg;

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
        htmlMsg: htmlMsg
      };

      if (msg) {

        beforeHelperParams.msg = msg;

      }

      res = await sails.helpers.funnel[beforeHelperBlock][beforeHelperName].with(beforeHelperParams);

    } else {

      /**
       * Throw error: we could not parse the specified beforeHelper
       */

      throw {err: {
          module: 'api/helpers/funnel/proceed-next-block',
          message: sails.config.custom.PROCEED_NEXT_BLOCK_BEFOREHELPER_PARSE_ERROR,
          payload: {
            params: inputs,
            helperName: block.beforeHelper,
            afterHelperBlock: beforeHelperBlock,
            afterHelperName: beforeHelperName,
          }
        }
      };

    }

  }

  return res;

}


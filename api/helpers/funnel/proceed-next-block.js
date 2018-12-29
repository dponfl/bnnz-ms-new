"use strict";

const _ = require('lodash');
const generalServices = require('../../services/general');
const restLinks = generalServices.RESTLinks();


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

    let messageSuccessful = false;
    let messageResult = '';

    let block = _.find(inputs.client.funnels[inputs.funnelName], {id: inputs.blockId});

    // sails.log.debug('Found block: ', block);

    if (
      block.enabled
      && !block.shown
      && !block.done
      && block.actionType
    ) {

      switch (block.actionType) {

        case 'text':

          /**
           * Send simple text message
           */

          let paramsSimple = {
            messenger: inputs.client.messenger,
            chatId: inputs.client.chat_id,
            html: block.message.html,
          };

          let simpleRes = await sails.helpers.general.sendRest('POST', restLinks.mgSendSimpleMessage, paramsSimple);

          sails.log.debug('simpleRes: ', simpleRes);
          sails.log.debug('simpleRes payload: ', simpleRes.payload.payload.payload);

          block.message_id = simpleRes.payload.payload.payload.payload.message_id;

          if (_.isNil(simpleRes.status) || simpleRes.status != 'ok') {

            sails.log.error('Simple message was not successful: \nblock: ', block,
              '\nclient: ', inputs.client.guid);

            return exits.success({
              status: 'nok',
              message: 'Simple message was not successful',
              payload: {
                client: inputs.client,
                block: block,
              }
            })

          }
          break;

        case 'forced':

          /**
           * Send forced reply message
           */

          let paramsForced = {
            messenger: inputs.client.messenger,
            chatId: inputs.client.chat_id,
            html: block.message.html,
          };

          let forcedRes = await sails.helpers.general.sendRest('POST', restLinks.mgSendForcedMessage, paramsForced);

          sails.log.debug('forcedRes: ', forcedRes);
          sails.log.debug('forcedRes payload: ', forcedRes.payload.payload.payload);

          block.message_id = forcedRes.payload.payload.payload.payload.message_id;

          if (_.isNil(forcedRes.status) || forcedRes.status != 'ok') {

            sails.log.error('Forced reply message was not successful: \nblock: ', block,
              '\nclient: ', inputs.client.guid);

            return exits.success({
              status: 'nok',
              message: 'Forced reply message was not successful',
              payload: {
                client: inputs.client,
                block: block,
              }
            })

          }
          break;

        case 'inline_keyboard':

          /**
           * Send inline keyboard message
           */

          let paramsInline = {
            messenger: inputs.client.messenger,
            chatId: inputs.client.chat_id,
            html: block.message.html,
            inline_keyboard: block.message.inline_keyboard,
          };

          let inlineRes = await sails.helpers.general.sendRest('POST', restLinks.mgSendInlineButtons, paramsInline);

          sails.log.debug('inlineRes: ', inlineRes);
          sails.log.debug('inlineRes payload: ', inlineRes.payload.payload.payload);

          block.message_id = inlineRes.payload.payload.payload.payload.message_id;

          if (_.isNil(inlineRes.status) || inlineRes.status != 'ok') {

            sails.log.error('Inline keyboard message was not successful: \nblock: ', block,
              '\nclient: ', inputs.client.guid);

            return exits.success({
              status: 'nok',
              message: 'Inline keyboard message was not successful',
              payload: {
                client: inputs.client,
                block: block,
              }
            })

          }
          break;
      }


    }

    if (_.isNil(block.afterHelper)) {

      await sails.helpers.funnel.afterHelperGeneric(inputs.client, block, inputs.msg);

    } else {

      let splitAfterHelperRes = _.split(block.afterHelper, sails.config.custom.JUNCTION, 2);
      let afterHelperBlock = splitAfterHelperRes[0];
      let afterHelperName = splitAfterHelperRes[1];

      if (!_.isNil(sails.helpers.funnel[afterHelperBlock][afterHelperName])) {

        await sails.helpers.funnel[afterHelperBlock][afterHelperName](inputs.client, block, inputs.msg);

      } else {

        return exits.success({
          status: 'nok',
          message: 'The helper with afterHelperBlock=' +
              afterHelperBlock + ' and afterHelperName=' + afterHelperName +
              ' was not found',
          payload: {
            client: inputs.client,
            block: block,
          }
        });

      }

    }

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

        await sails.helpers.funnel.proceedNextBlock(inputs.client, nextFunnel, nextId, inputs.msg);

      }

    }


    return exits.success({status: 'ok',
      message: 'success',
      payload: {
        client: inputs.client,
        block: block
      }});

  }

};


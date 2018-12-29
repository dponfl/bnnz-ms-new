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

    let block = _.find(inputs.client.funnels[inputs.funnelName], {id: inputs.blockId});

    sails.log.debug('Found block: ', block);

    if (
      block.enabled
      && !block.shown
    ) {

      let params = {
        messenger: inputs.client.messenger,
        chatId: inputs.client.chat_id,
        html: block.message.html,
      };

      // TODO: delete after testing
      block.actionType = Math.random();

      let res = await sails.helpers.general.sendRest('POST', restLinks.mgSendSimpleMessage, params);

    }

    if (_.isNil(block.afterHelperBlock) || _.isNil(block.afterHelperName)) {

      await sails.helpers.funnel.afterHelperGeneric(inputs.client, block);

    } else {

      if (!_.isNil(sails.helpers.funnel[block.afterHelperBlock][block.afterHelperName])) {

        await sails.helpers.funnel[block.afterHelperBlock][block.afterHelperName](inputs.client, block);

      } else {

        throw {err: {status: 'nok', message: 'The helper with afterHelperBlock=' +
              block.afterHelperBlock + ' and afterHelperName=' + block.afterHelperName +
              ' was not found'}};

      }

    }

    let splitRes = _.split(block.next, sails.config.custom.JUNCTION, 2);
    let nextFunnel = splitRes[0];
    let nextId = splitRes[1];

    sails.log.debug('nextFunnel: ', nextFunnel);
    sails.log.debug('nextId: ', nextId);

    if (
      nextFunnel
      && nextId
    ) {

      await sails.helpers.funnel.proceedNextBlock(inputs.client, nextFunnel, nextId);

    }

    exits.success();

  }

};


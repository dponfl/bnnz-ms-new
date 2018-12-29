"use strict";

const _ = require('lodash');
const t = require('../../../services/translate');
const generalServices = require('../../../services/general');
const restLinks = generalServices.RESTLinks();

const moduleName = 'Helper general:chatListeners.telegramListener';



module.exports = {


  friendlyName: 'On message',


  description: 'Manage text Telegram messages',


  inputs: {

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

    sails.log.info('telegramListener.onMessage started...');


    sails.config.custom.telegramBot.on('message', async (msg) => {

      sails.log.debug('Message received: ', msg);

      let getClientResponse = await sails.helpers.general.getClient.with({
        messenger: 'telegram',
        chatId: '372204823',
      });

      if (
        !_.isNil(getClientResponse)
        && !_.isNil(getClientResponse.status)
        && getClientResponse.status === 'ok'
        && !_.isNil(getClientResponse.payload)
      ) {

        let checkFunnelsRes = await sails.helpers.general.checkFunnels(getClientResponse.payload);

        if (
          !_.isNil(checkFunnelsRes)
          && !_.isNil(checkFunnelsRes.status)
          && checkFunnelsRes.status === 'ok'
        ) {

          sails.log.warn('Client before: ', getClientResponse.payload.funnels.start);

          if (getClientResponse.payload.funnels.current) {

            let initialBlock = _.find(getClientResponse.payload.funnels[getClientResponse.payload.funnels.current],
              {previous: null});

            sails.log.debug('initialBlock: ', initialBlock);

            await sails.helpers.funnel.proceedNextBlock(getClientResponse.payload,
              getClientResponse.payload.funnels.current,
              'start_step_01');

            sails.log.warn('Client after: ', getClientResponse.payload.funnels.start);

          } else {

            sails.log.error('Funnels current is not defined: ', getClientResponse.payload);

          }


        } else {

          sails.log.error('Funnels check was not successful');

        }

      }

    });

    return exits.success();

  } //fn


};

// async function proceedNextBlock(client, funnelKey, blockId) {
//
//   try {
//     /**
//      * Recursive function to show all linked blocks that meets conditions
//      */
//
//     let block = _.find(client.funnels[funnelKey], {id: blockId});
//
//     sails.log.debug('Found block: ', block);
//
//     if (
//       block.enabled
//       && !block.shown
//     ) {
//
//       let params = {
//         messenger: client.messenger,
//         chatId: client.chat_id,
//         html: block.message.html,
//       };
//
//       block.actionType = Math.random();
//
//       let res = await sails.helpers.general.sendRest('POST', restLinks.mgSendSimpleMessage, params);
//
//     }
//
//     if (_.isNil(block.afterHelperBlock) || _.isNil(block.afterHelperName)) {
//
//       await sails.helpers.funnel.afterHelperGeneric(client, block);
//
//     } else {
//
//       if (!_.isNil(sails.helpers.funnel[block.afterHelperBlock][block.afterHelperName])) {
//
//         await sails.helpers.funnel[block.afterHelperBlock][block.afterHelperName](client, block);
//
//       } else {
//
//         throw {err: {status: 'nok', message: 'The helper with afterHelperBlock=' +
//               block.afterHelperBlock + ' and afterHelperName=' + block.afterHelperName +
//               ' was not found'}};
//
//       }
//
//     }
//
//     let splitRes = _.split(block.next, sails.config.custom.JUNCTION, 2);
//     let nextFunnel = splitRes[0];
//     let nextId = splitRes[1];
//
//     sails.log.debug('nextFunnel: ', nextFunnel);
//     sails.log.debug('nextId: ', nextId);
//
//     if (
//       nextFunnel
//       && nextId
//     ) {
//
//       await proceedNextBlock(client, nextFunnel, nextId);
//
//     }
//   } catch (e) {
//
//     sails.log.error(e);
//
//   }
//
//
//
//
// } // proceedNextBlock


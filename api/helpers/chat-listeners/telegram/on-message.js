"use strict";

const t = require('../../../services/translate');
const generalServices = require('../../../services/general');
const restLinks = generalServices.RESTLinks();

const moduleName = 'Helper general:chatListeners.telegranListener';



module.exports = {


  friendlyName: 'On message',


  description: 'Manage text Telegram messages',


  inputs: {

  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {

    sails.log.info('telegramListener.onMessage started...');


    sails.config.custom.telegramBot.on('message', async (msg) => {

      sails.log.debug('Message received: ', msg);

      let getClientResponse = await sails.helpers.general.getClientTest.with({
        messenger: 'telegram',
        chatId: '372204823',
      });

      if (
        !_.isNil(getClientResponse)
        && !_.isNil(getClientResponse.status)
        && getClientResponse.status === 'ok'
        && !_.isNil(getClientResponse.payload)
      ) {

        await proceedNextBlock(getClientResponse.payload.funnel.start,
          getClientResponse.payload.funnel.start[0].id,
          getClientResponse.payload.messenger,
          getClientResponse.payload.chat_id);

      }

    });

    return exits.success();

  } //fn


};

async function proceedNextBlock(blocks, blockId, messenger, chatId) {

  /**
   * Recursive function to show all blocks of array meeting conditions
   */

  blocks.map(async (block) => {

    if (
      block.id == blockId
      && block.enabled
      && !block.shown
    ) {

      let params = {
        messenger: messenger,
        chatId: chatId,
        html: block.message.html,
      };

      let res = await sails.helpers.general.sendRest('POST', restLinks.mgSendSimpleMessage, params);

      if (block.next) {

        await proceedNextBlock(blocks, block.next, messenger, chatId)

      }

    }

  })

} // proceedNextBlock


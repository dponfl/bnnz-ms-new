"use strict";

// const messageGatewayServices = require('../../../../api/services/messageGateway');
// const bot = messageGatewayServices.getTelegramBot();


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

    sails.config.custom.telegramBot.on('message', (msg) => {

      sails.log.debug('Test message received: ', msg);


    });

    return exits.success();

  }


};


"use strict";

module.exports = {

  friendlyName: 'On pre_checkout_query message',


  description: 'Manage pre_checkout_query Telegram messages',


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

  fn: async function(inputs, exits) {

    sails.log.info('******************** telegramListener.onPreCheckoutQuery ********************');

    sails.config.custom.telegramBot.on('pre_checkout_query', async (msg) => {



    })

  }

};

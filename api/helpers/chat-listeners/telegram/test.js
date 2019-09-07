"use strict";

const _ = require('lodash');


module.exports = {


  friendlyName: 'Test bot',


  description: 'Test bot',


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

    sails.log.info('******************** telegramListener.test ********************');

    sails.config.custom.telegramBot.on('message', async (msg) => {


      try {

        if (_.trim(msg.text).match(/test/i)) {

          await sails.helpers.mgw.telegram['simpleMessage'].with({
            chatId: msg.chat.id,
            html: `Payment gateway name: ${sails.config.custom.config.pgw.name}`,
          });

        }

      } catch (err) {

        sails.log.error('Test bot error: ', err);

      }

    });

    /**
     * The below return needed for normal functioning of config/bootstrap.js
     */

    return exits.success({
      status: 'ok',
      message: 'success',
      payload: {}
    });

  } //fn

};



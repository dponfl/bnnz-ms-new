"use strict";

const _ = require('lodash');


module.exports = {


  friendlyName: 'On callback query',


  description: 'Manage Telegram bot callback queries',


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

    sails.config.custom.telegramBot.on('callback_query', async (query) => {

      try {

        sails.log.info('Got callback query: ', query);

        await sails.config.custom.telegramBot.answerCallbackQuery(query.id);

        /**
         * Get the client record from DB
         */

        let getClientResponse = await sails.helpers.storage.getClient.with({
          messenger: 'telegram',
          msg: query,
        });

        /**
         * Call the respective Supervisor helper
         */

        await sails.helpers.funnel[getClientResponse.payload.current_funnel]['supervisorCallback'](getClientResponse.payload, query);

      } catch (e) {

        /**
         * Make error log and return
         */

        sails.log.error('on-callback-query, error: ', e);

        try {

          await sails.helpers.general.logError.with({
            client_guid: 'none',
            error_message: sails.config.custom.ON_CALLBACK_QUERY_ERROR,
            level: 'critical',
            payload: {
              messenger: 'telegram',
              query: query,
              error: e,
            }
          });

        } catch (err) {

          sails.log.error(sails.config.custom.ON_CALLBACK_QUERY_ERROR + ', Error log create error: ', err);

        }

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

  }


};


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

    sails.log.info('telegramListener.callback_query started...');

    sails.config.custom.telegramBot.on('callback_query', async (query) => {

      sails.log.info('Got callback query: ', query);

      await sails.config.custom.telegramBot.answerCallbackQuery(query.id);

      /**
       * Get the client record from DB
       */

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

        /**
         * Call the respective Supervisor helper
         */

        if (
          !_.isNil(getClientResponse.payload.funnels.current
            && !_.isNil(sails.helpers.funnel[getClientResponse.payload.funnels.current]['supervisorCallback'])
          )) {

          await sails.helpers.funnel[getClientResponse.payload.funnels.current]['supervisorCallback'](getClientResponse.payload, query);

        } else {

          sails.log.error('Funnels key=current is not defined ' +
            'or the respective supervisor does not exist:\nclient: ',
            getClientResponse.payload);

          try {

            await sails.helpers.general.logError.with({
              client_guid: getClientResponse.payload.guid,
              error_message: 'Funnels key=current is not defined ' +
                'or the respective supervisor does not exist',
              level: 'critical',
              payload: getClientResponse.payload
            });

          } catch (e) {

            sails.log.error('Error log create error: ', e);

          }

        }

      } else {

        sails.log.error('Client was not found: \nclient: ',
          getClientResponse);

        try {

          await sails.helpers.general.logError.with({
            client_guid: getClientResponse.payload.guid,
            error_message: 'Client was not found',
            level: 'critical',
            payload: getClientResponse
          });

        } catch (e) {

          sails.log.error('Error log create error: ', e);

        };

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


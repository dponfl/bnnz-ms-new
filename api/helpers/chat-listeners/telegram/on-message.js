"use strict";

const _ = require('lodash');
const t = require('../../../services/translate');


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

      /**
       * Get the client record from DB
       */

      let getClientResponse = await sails.helpers.general.getClient.with({
        messenger: 'telegram',
        chatId: '372204823',
      });

      /**
       * Check if the client found
       */

      if (
        !_.isNil(getClientResponse)
        && !_.isNil(getClientResponse.status)
        && getClientResponse.status === 'ok'
        && !_.isNil(getClientResponse.payload)
      ) {

        /**
         * Check that funnels do not have big errors
         */

        let checkFunnelsRes = await sails.helpers.general.checkFunnels(getClientResponse.payload);

        if (
          !_.isNil(checkFunnelsRes)
          && !_.isNil(checkFunnelsRes.status)
          && checkFunnelsRes.status === 'ok'
        ) {

          /**
           * Call the respective Supervisor helper
           */

          if (
            !_.isNil(getClientResponse.payload.funnels.current
            && !_.isNil(sails.helpers.funnel[getClientResponse.payload.funnels.current]['supervisorText'])
          )) {

            await sails.helpers.funnel[getClientResponse.payload.funnels.current]['supervisorText'](getClientResponse.payload, msg);

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

          // sails.log.warn('Client before: ', getClientResponse.payload.funnels.start);


        } else {

          sails.log.error('Funnels check was not successful: \nclient: ',
            getClientResponse.payload);

          try {

            await sails.helpers.general.logError.with({
              client_guid: getClientResponse.payload.guid,
              error_message: 'Funnels check was not successful',
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

  } //fn


};



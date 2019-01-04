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

            return exits.success({
              status: 'nok',
              message: 'Funnels key=current is not defined',
              payload: {client: getClientResponse.payload}
            });

          }

          // sails.log.warn('Client before: ', getClientResponse.payload.funnels.start);


        } else {

          sails.log.error('Funnels check was not successful: \nclient: ',
            getClientResponse.payload);

          return exits.success({
            status: 'nok',
            message: 'Funnels check was not successful',
            payload: {client: getClientResponse.payload}
          });

        }

      } else {

        sails.log.error('Client was not found: \nclient: ',
          getClientResponse);

        return exits.success({
          status: 'nok',
          message: 'Client was not found',
          payload: {client: getClientResponse}
        });

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



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
         * Get message_id from the callback query
         */

        if (!_.isNil(query.message.message_id)) {

          /**
           * Find block and get callback helper
           */

          let block = _.find(getClientResponse.payload.funnels[getClientResponse.payload.funnels.current],
            {message_id: query.message.message_id});

          if (!_.isNil(block)) {

            let splitCallbackHelperRes = _.split(block.callbackHelper, sails.config.custom.JUNCTION, 2);
            let callbackHelperBlock = splitCallbackHelperRes[0];
            let callbackHelperName = splitCallbackHelperRes[1];

            if (!_.isNil(sails.helpers.funnel[callbackHelperBlock][callbackHelperName])) {

              await sails.helpers.funnel[callbackHelperBlock][callbackHelperName](getClientResponse.payload, block, query);

            } else {

              sails.log.error('The helper with callbackHelperBlock=' +
                callbackHelperBlock + ' and callbackHelperName=' + callbackHelperName +
                ' was not found');

              return exits.success({
                status: 'nok',
                message: 'The helper with callbackHelperBlock=' +
                  callbackHelperBlock + ' and callbackHelperName=' + callbackHelperName +
                  ' was not found',
                payload: {
                  client: getClientResponse.payload,
                  block: block,
                }
              });

            }


          }

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

    return exits.success({
      status: 'ok',
      message: 'success',
      payload: {}
    });

  }


};


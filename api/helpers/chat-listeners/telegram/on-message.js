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

      let lang = 'en';

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

          // sails.log.warn('Client before: ', getClientResponse.payload.funnels.start);

          if (getClientResponse.payload.funnels.current) {

            let initialBlock = _.find(getClientResponse.payload.funnels[getClientResponse.payload.funnels.current],
              {previous: null});

            // sails.log.debug('initialBlock: ', initialBlock);

            if (!_.isNil(initialBlock) && !_.isNil(initialBlock.id)) {

              await sails.helpers.funnel.proceedNextBlock(getClientResponse.payload,
                getClientResponse.payload.funnels.current,
                initialBlock.id, msg);

              sails.log.warn('Client after: ', getClientResponse.payload.funnels.start);


            } else {

              sails.log.error('Initial block was not found of its ID is not defined: \nclient: ',
                getClientResponse.payload);

              return exits.success({
                status: 'nok',
                message: 'Funnels check was not successful',
                payload: {client: getClientResponse.payload}
              });

            }


          } else {

            sails.log.error('Funnels key=current is not defined:\nclient: ',
              getClientResponse.payload);

            return exits.success({
              status: 'nok',
              message: 'Funnels check was not successful',
              payload: {client: getClientResponse.payload}
            });

          }


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

    return exits.success({
      status: 'ok',
      message: 'success',
      payload: {}
    });

  } //fn


};



"use strict";

const _ = require('lodash');
const t = require('../../../services/translate');
const uuid = require('uuid-apikey');


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

      let getClientResponse = null;

      try {

        getClientResponse = await sails.helpers.storage.getClient.with({
          messenger: 'telegram',
          msg: msg
        })
          .tolerate('noClientFound', async (payload) => {

            sails.log.warn('noClientFound, payload:', payload);

            /**
             * Client record was not found => create new client record
             */

            let parseRefResult = null;
            let parseSlResult = null;

            let useRefKey = '';
            let useIsRef = false;

            let useServiceRefKey = '';


            if (_.trim(msg.text).match(/\/start/i)) {

              parseRefResult = _.trim(msg.text).match(/ref(\S+)/i);
              parseSlResult = _.trim(msg.text).match(/sr(\S+)/i);

            }

            if (parseRefResult) {

              useIsRef = true;
              useRefKey = parseRefResult[1];

            }

            if (parseSlResult) {

              useServiceRefKey = parseSlResult[1];

            }

            let getLangRes = await sails.helpers.chatListeners.telegram.getUserLang(msg);
            let useLang = 'en';

            if (!_.isNil(getLangRes)
              && !_.isNil(getLangRes.status)
              && getLangRes.status === 'ok'
              && !_.isNil(getLangRes.payload)
              && !_.isNil(getLangRes.payload.lang)
            ) {

              useLang = getLangRes.payload.lang;

            }

            let params = {
              messenger: 'telegram',
              guid: uuid.create().uuid,
              chat_id: msg.chat.id,
              first_name: msg.chat.first_name || '',
              last_name: msg.chat.last_name || '',
              username: msg.chat.username,
              lang: useLang,
              ref_key: useRefKey,
              is_ref: useIsRef,
            };


            /**
             * Get info about service level
             */

            let getServiceRefRes = null;
            let serviceName = 'generic';
            let serviceId = null;

            if (useServiceRefKey) {

              try {

                getServiceRefRes = await sails.helpers.storage.getServiceRef.with({serviceKey: useServiceRefKey});

                sails.log.info('getServiceRefRes: ', getServiceRefRes);


                if (!_.isNil(getServiceRefRes)
                  && !_.isNil(getServiceRefRes.status)
                  && getServiceRefRes.status === 'ok'
                ) {

                  serviceName = getServiceRefRes.service;

                } else {


                  sails.log.error('getServiceRef did not throw error and did not return ok');

                  try {

                    await sails.helpers.general.logError.with({
                      client_guid: getClientResponse.payload.guid,
                      error_message: 'getServiceRef did not throw error and did not return ok',
                      level: 'critical',
                      payload: {}
                    });

                  } catch (err) {

                    sails.log.error('Error log create error: ', err);

                  }

                }

              } catch (e) {

                sails.log.error('getServiceRef throw error: ', e);

                try {

                  await sails.helpers.general.logError.with({
                    client_guid: getClientResponse.payload.guid,
                    error_message: 'getServiceRef throw error',
                    level: 'critical',
                    payload: e
                  });

                } catch (err) {

                  sails.log.error('Error log create error: ', err);

                }

              }

            }

            /**
             * Get all info about the respective service
             */

            let getServiceRes = null;

            try {

              getServiceRes = await sails.helpers.storage.getService.with({serviceName: serviceName});

              params.service = getServiceRes.payload.id;

              /**
               * Use info about funnel (from Service table) and load it from Funnels table
               */

              params.current_funnel = getServiceRes.payload.funnel_start;

              // TODO: Get funnels depends on funnel_name for the respective service level

              let funnels = await Funnels.findOne({
                name: getServiceRes.payload.funnel_name,
                active: true
              });

              params.funnels = funnels.funnel_data || null;


            } catch (e) {

              sails.log.error('on-message, error: ', e);

              try {

                await sails.helpers.general.logError.with({
                  client_guid: getClientResponse.payload.guid || 'none',
                  error_message: 'Error',
                  level: 'critical',
                  payload: e
                });

              } catch (err) {

                sails.log.error('Error log create error: ', err);

              }

            }


            sails.log.warn('params: ', params);

            try {

              return await sails.helpers.storage.clientCreate(params);

            } catch (e) {

              sails.log.error('Client create error: ', e);

              try {

                await sails.helpers.general.logError.with({
                  client_guid: getClientResponse.payload.guid,
                  error_message: 'Client create error',
                  level: 'critical',
                  payload: e
                });

              } catch (e) {

                sails.log.error('Error log create error: ', e);

              }

            }

          })
          .intercept('err', async (payload) => {

            /**
             * Some error on getClient, log error and exit
             */

            sails.log.error('getClient gives error: ', payload);

            try {

              await sails.helpers.general.logError.with({
                client_guid: 'none',
                error_message: 'getClient gives error',
                level: 'critical',
                payload: payload
              });

            } catch (e) {

              sails.log.error('Error log create error: ', e);

            }

            return null;

          });

      } catch (e) {

        /**
         * Make error log and return
         */

        sails.log.error('on-message, getClient error');

        try {

          await sails.helpers.general.logError.with({
            client_guid: 'none',
            error_message: 'on-message, getClient error',
            level: 'critical',
            payload: e
          });

        } catch (err) {

          sails.log.error('Error log create error: ', err);

        }

        return;

      }

      /**
       * Check if we have necessary client data
       */

      if (
        !_.isNil(getClientResponse)
        && !_.isNil(getClientResponse.status)
      ) {


        /**
         * Proceed based on client record info
         */

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
            !_.isNil(getClientResponse.payload.current_funnel
          )) {

            try {

              await sails.helpers.funnel[getClientResponse.payload.current_funnel]['supervisorText'](getClientResponse.payload, msg);

            } catch (e) {

              sails.log.error('Respective supervisor does not exist:\nError: ', e);

              try {

                await sails.helpers.general.logError.with({
                  client_guid: getClientResponse.payload.guid,
                  error_message: 'Respective supervisor does not exist',
                  level: 'critical',
                  payload: e
                });

              } catch (e) {

                sails.log.error('Error log create error: ', e);

              }

            }


          } else {

            sails.log.error('Client field current_funnel is not defined ' +
              'or the respective supervisor does not exist:\nclient: ',
              getClientResponse.payload);

            try {

              await sails.helpers.general.logError.with({
                client_guid: getClientResponse.payload.guid,
                error_message: 'Client field current_funnel is not defined ' +
                  'or the respective supervisor does not exist',
                level: 'critical',
                payload: getClientResponse.payload
              });

            } catch (e) {

              sails.log.error('Error log create error: ', e);

            }

          }

          // sails.log.warn('Client before: ', getClientResponse.payload.funnels.optin);


        } else {

          sails.log.error('Funnels check was not successful: \nclient: ',
            getClientResponse.payload);

          try {

            await sails.helpers.general.logError.with({
              client_guid: getClientResponse.payload.guid,
              error_message: 'Funnels check was not successful',
              level: 'critical',
              payload: {
                getClientResponse: getClientResponse.payload,
                checkFunnelsResponse: checkFunnelsRes.payload,
              }
            });

          } catch (e) {

            sails.log.error('Error log create error: ', e);

          }

        }

      } else {

        sails.log.error('Client find error: \nclient: ',
          getClientResponse);

        try {

          await sails.helpers.general.logError.with({
            client_guid: getClientResponse.payload.guid,
            error_message: 'Client find error',
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



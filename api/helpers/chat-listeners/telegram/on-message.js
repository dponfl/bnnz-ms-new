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

      let getClientResponse = await sails.helpers.general.getClient.with({
        messenger: 'telegram',
        msg: msg
      });

      /**
       * Check if the client found
       */

      if (
        !_.isNil(getClientResponse)
        && !_.isNil(getClientResponse.status)
      ) {

        if (
          getClientResponse.status === 'nok'
          && getClientResponse.message === sails.config.custom.CLIENT_NOT_FOUND
        ) {

          /**
           * Create new client record
           */

          let parseRefResult = null;
          let parseSlResult = null;

          let useRefKey = '';
          let useIsRef = false;

          let useSlKey = '';


          if (_.trim(msg.text).match(/\/start/i)) {

            parseRefResult = _.trim(msg.text).match(/ref(\S+)/i);
            parseSlResult = _.trim(msg.text).match(/sl(\S+)/i);

          }

          if (parseRefResult) {

            useIsRef = true;
            useRefKey = parseRefResult[1];

          }

          if (parseSlResult) {

            useSlKey = parseSlResult[1];

          }

          let getLangRes = await sails.helpers.chatListeners.telegram.getUserLang(msg);
          let useLang = 'en';

          if (!_.isNil(getLangRes)
            && !_.isNil(getLangRes.status)
            && getLangRes.status == 'ok'
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
            // lang: getUserLang(inputs.msg),
            lang: useLang,
            ref_key: '',
            is_ref: false,
          };

          /**
           * Get info about referral code
           */

          params.ref_key = useRefKey; // depend on getRef result
          params.is_ref = useIsRef; // depend on getRef result

          /**
           * Get info about service level
           */

          params.service = 31; // depend on getService result
          params.current_funnel = 'optin'; // depend on getService result (funnel_start)




          // TODO: Get funnels depends on funnel_name for the respective service level

          let funnels = await Funnels.findOne({active: true});

          params.funnels = funnels.funnel_data || null;

          // sails.log('funnels: ', funnels);

          sails.log.warn('params: ', params);

          try {

            getClientResponse = await sails.helpers.storage.clientCreate(params);

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

        } else if (
          getClientResponse.status === 'nok'
          && getClientResponse.message !== sails.config.custom.CLIENT_NOT_FOUND
        ) {

          /**
           * Some error on getClient, log error and exit
           */

          sails.log.error('getClient gives error: ', getClientResponse);

          try {

            await sails.helpers.general.logError.with({
              client_guid: getClientResponse.payload.guid,
              error_message: 'getClient gives error',
              level: 'critical',
              payload: getClientResponse
            });

          } catch (e) {

            sails.log.error('Error log create error: ', e);

          }

        }

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
              payload: getClientResponse.payload
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



"use strict";

const _ = require('lodash');
// const uuid = require('uuid-apikey');


module.exports = {


  friendlyName: 'On text message',


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

    sails.log.info('******************** telegramListener.onText ********************');

    sails.config.custom.telegramBot.on('text', async (msg) => {

      // sails.log.debug('Message received: ', msg);

      /**
       * Try to get the client record from DB
       */

      let getClientResponse = null;
      let getServiceRes = null;
      let funnels = null;
      let parseRefResult = null;
      let parseSlResult = null;
      let useRefKey = '';
      // let useIsRef = false;
      let useServiceRefKey = '';
      let getLangRes;
      let useLang;
      let params = {};
      let getServiceRefResRaw = null;
      let serviceName = 'generic';
      const role = 'user';


      try {

        getClientResponse = await sails.helpers.storage.clientGet.with({
          messenger: 'telegram',
          msg: msg
        });

        // sails.log.warn('!!!!!!!!!!!!!!!!!!!! on-message, clientGet result:', getClientResponse);

        if (getClientResponse.status === 'not_found') {

          /**
           * Client record was not found => create new client record
           */

          if (_.trim(msg.text).match(/\/start/i)) {

            /**
             * If we got start command - try to parse it and get referral key (ref)
             * and service reference key (sref)
             */

            parseRefResult = _.trim(msg.text).match(/ref(\S+)/i);
            parseSlResult = _.trim(msg.text).match(/sref(\S+)/i);

          }

          if (parseRefResult) {

            // useIsRef = true;
            useRefKey = parseRefResult[1];

          }

          if (parseSlResult) {

            useServiceRefKey = parseSlResult[1];

          }

          /**
           * Try to get user preferred language from received message
           */

          getLangRes = await sails.helpers.chatListeners.telegram.getUserLang(msg);
          useLang = getLangRes.payload.lang;

          params = {
            messenger: 'telegram',
            // guid: uuid.create().uuid,
            // key: uuid.create().apiKey,
            chat_id: msg.chat.id,
            first_name: msg.chat.first_name || '',
            last_name: msg.chat.last_name || '',
            username: msg.chat.username,
            lang: useLang,
            ref_key: useRefKey,
            // is_ref: useIsRef,
            role: role,
          };


          /**
           * Get info about service level
           */


          if (useServiceRefKey) {

            /**
             * Client has service reference key - we need to get service name and
             * set flag the this service reference key is used
             */

            getServiceRefResRaw = await sails.helpers.storage.getServiceRef.with({serviceKey: useServiceRefKey});

            // sails.log.info('getServiceRefResRaw: ', getServiceRefResRaw);

            serviceName = getServiceRefResRaw.payload.service;
            params.role = getServiceRefResRaw.payload.role;

          }

          /**
           * Get info about the respective service
           */

          getServiceRes = await sails.helpers.storage.getService.with({serviceName: serviceName});
          params.service_id = getServiceRes.payload.id;

          /**
           * Use info about funnel (from Service table) and load it from Funnels table
           */

          params.current_funnel = getServiceRes.payload.funnel_start;
          params.funnel_name = getServiceRes.payload.funnel_name;

          funnels = await Funnels.findOne({
            name: getServiceRes.payload.funnel_name,
            active: true
          });

          params.funnels = funnels.funnel_data || null;

          // sails.log.warn('params: ', params);

          getClientResponse = await sails.helpers.storage.clientCreate(params);

        }

        /**
         * Client record was found - proceed based on client record info
         */

        /**
         * Check that funnels do not have big errors
         */

        await sails.helpers.general.checkFunnels(getClientResponse.payload);

        /**
         * Call the respective supervisorText helper
         */

        // await sails.helpers.funnel[getClientResponse.payload.current_funnel]['supervisorText'](getClientResponse.payload, msg);

        await sails.helpers.funnel.supervisorText(getClientResponse.payload, msg);


      } catch (e) {


        /**
         * Make error log and return
         */

        sails.log.error('on-message, error: ', e);

        try {

          await sails.helpers.general.logError.with({
            client_guid: 'none',
            error_message: sails.config.custom.ON_MESSAGE_ERROR,
            level: 'critical',
            payload: {
              messenger: 'telegram',
              msg: msg,
              error: e,
            }
          });

        } catch (err) {

          sails.log.error(sails.config.custom.ON_MESSAGE_ERROR + ', Error log create error: ', err);

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


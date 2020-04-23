"use strict";


const moduleName = 'chat-listeners:telegram:on-text';


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

      let getClientResponse = null;
      let getServiceRes = null;
      let funnels = null;
      let parseRefResult = null;
      let parseServiceResult = null;
      let parseCategoryResult = null;
      let useRefKey = null;
      let useServiceRefKey = '';
      let useCategoryRefKey = '';
      let getLangRes;
      let useLang;
      let params = {};
      let getServiceRefResRaw = null;
      let getCategoryRefResRaw = null;
      let serviceName = null;
      let categoryName = 'user';


      try {

        /**
         * Try to get the client record from DB
         */

        getClientResponse = await sails.helpers.storage.clientGet.with({
          messenger: sails.config.custom.enums.messenger.TELEGRAM,
          msg: msg
        });

        // sails.log.warn('!!!!!!!!!!!!!!!!!!!! on-message, clientGet result:', getClientResponse);

        if (getClientResponse.status === 'not_found') {

          /**
           * Client record was not found => create new client record
           */

          if (_.trim(msg.text).match(/\/start/i)) {

            /**
             * If we got start command - try to parse it and get referral key (ref),
             * service reference key (srf) and category key (cat)
             */

            parseRefResult = _.trim(msg.text).match(/ref(\S{31})/);
            parseServiceResult = _.trim(msg.text).match(/srf(\S{31})/);
            parseCategoryResult = _.trim(msg.text).match(/cat(\S{31})/);

          }

          // TODO: Добавить ниже проверку валидности полученных ключей

          if (parseRefResult) {

            // useIsRef = true;
            useRefKey = parseRefResult[1];

          }

          if (parseServiceResult) {

            useServiceRefKey = parseServiceResult[1];

          }

          if (parseCategoryResult) {

            useCategoryRefKey = parseServiceResult[1];

          }

          /**
           * Try to get user preferred language from received message
           */

          getLangRes = await sails.helpers.chatListeners.telegram.getUserLang(msg);
          useLang = getLangRes.payload.lang;

          params = {
            messenger: sails.config.custom.enums.messenger.TELEGRAM,
            chat_id: msg.chat.id,
            first_name: msg.chat.first_name || '',
            last_name: msg.chat.last_name || '',
            username: msg.chat.username,
            lang: useLang,
            ref_key: useRefKey,
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
          }

          if (serviceName) {

            /**
             * Get info about the respective service
             */

            getServiceRes = await sails.helpers.storage.getService.with({serviceName: serviceName});
            params.service_id = getServiceRes.payload.id;

          }


          /**
           * Get info about client's category
           */

          if (useCategoryRefKey) {

            /**
             * Client has category reference key - we need to get category
             * and save it at client's profile
             */

            getCategoryRefResRaw = await sails.helpers.storage.getCategoryRef.with({categoryKey: useCategoryRefKey});

            // sails.log.info('getCategoryRefResRaw: ', getCategoryRefResRaw);

            categoryName = getCategoryRefResRaw.payload.category;
          }

          params.category = categoryName;


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

        // TODO: Убрать отсюда проверку воронок. Проверку воронок нужно делать один раз
        // при старте системы и реализовать возможность инициировать эту проверку через API
        // (это нужно для запуска проверки после загрузки обновления воронок)

        // await sails.helpers.general.checkFunnels(getClientResponse.payload);

        await sails.helpers.funnel.supervisorTextJoi({
          client: getClientResponse.payload,
          msg,
        });

      } catch (e) {

        const errorLocation = moduleName;
        const errorMsg = `${moduleName}: ${sails.config.custom.ON_MESSAGE_ERROR}`;

        sails.log.error(errorLocation + ', error: ' + errorMsg);
        sails.log.error(errorLocation + ', error details: ', e);

        throw {err: {
            module: errorLocation,
            message: errorMsg,
            payload: {
              error: e,
            },
          }
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

  } //fn


};



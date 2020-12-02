"use strict";

const _ = require('lodash');

const moduleName = 'chat-listeners:telegram:on-callback-query';

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

    sails.log.info('******************** telegramListener.onCallbackQuery ********************');

    sails.config.custom.telegramBot.on('callback_query', async (query) => {

      try {

        // sails.log.info('Got callback query: ', query);

        await sails.config.custom.telegramBot.answerCallbackQuery(query.id);

        /**
         * Get the client record from DB
         */

          // TODO: Добавить сюда проверку, что клиент успешно найден в БД

        let getClientResponse = await sails.helpers.storage.clientGet.with({
          messenger: sails.config.custom.enums.messenger.TELEGRAM,
          msg: query,
        });

        // sails.log.warn('!!!!!!!!!!!!!!!!!!!! on-callback-query, clientGet result:', getClientResponse);

        // TODO: Добавить сюда:
        //  - удаление кнопок из соответствующего inline_keyboard сообщения
        //  - отправку PushMessage с текстом нажатой кнопки


        /**
         * Call the respective Supervisor helper
         */

        /**
         * По данным callback_query проверяем к какой категории он относиться
         */

        if (/^push_msg_/i.test(query.data)) {

          /**
           * Полученный callback_query относиться к push messages
           */

          await sails.helpers.pushMessages.supervisorCallbackJoi({
            client: getClientResponse.payload,
            query,
          });

        } else {

          await sails.helpers.funnel.supervisorCallbackJoi({
            client: getClientResponse.payload,
            query,
          });

        }

      } catch (e) {


        // const errorLocation = moduleName;
        // const errorMsg = `${moduleName}: ${sails.config.custom.ON_CALLBACK_QUERY_ERROR}`;
        //
        // sails.log.error(errorLocation + ', error: ' + errorMsg);
        // sails.log.error(errorLocation + ', error details: ', e);
        //
        // throw {err: {
        //     module: errorLocation,
        //     message: errorMsg,
        //     payload: {
        //       error: e,
        //     },
        //   }
        // };

        const throwError = true;
        if (throwError) {
          return await sails.helpers.general.catchErrorJoi({
            error: e,
            location: moduleName,
            throwError: true,
          });
        } else {
          await sails.helpers.general.catchErrorJoi({
            error: e,
            location: moduleName,
            throwError: false,
          });
          return exits.success({
            status: 'ok',
            message: `${moduleName} performed`,
            payload: {},
          });
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


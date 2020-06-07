"use strict";

const utils = require('../../services/utils');

const moduleName = 'push-messages:supervisor-callback';


module.exports = {


  friendlyName: 'push-messages:supervisor-callback',


  description: 'Обработка callback_query относящихся к push messages',


  inputs: {

    client: {
      friendlyName: 'client',
      description: 'Client record',
      type: 'ref',
      required: true,
    },
    query: {
      friendlyName: 'query',
      description: 'Query received',
      type: 'ref',
      required: true,
    },

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

    try {

      /**
       * Save the received callback query message
       */

      utils.stubWrap(await sails.helpers.storage.messageSaveJoi.with({
        message_id: inputs.query.message.message_id || 0,
        callback_query_id: inputs.query.id || 0,
        message: inputs.query.data,
        message_format: sails.config.custom.enums.messageFormat.CALLBACK,
        messenger: inputs.client.messenger,
        message_originator: sails.config.custom.enums.messageOriginator.CLIENT,
        client_id: inputs.client.id,
        client_guid: inputs.client.guid
      }));


      /**
       * Определяем к какой категории push messages относиться callback
       * (пока реализованы только вариант обработки callback для задач (префикс push_msg_tsk_)
       */

      if (/^push_msg_tsk_/i.test(inputs.query.data)) {

        /**
         * Полученный callback относиться к типу заданий
         */

        /**
         * Определяем тип задания
         */

        if (/^push_msg_tsk_l_/i.test(inputs.query.data)) {

          /**
           * Задание на постановку лайков
           */

          if (!_.has(sails.config.custom.pushMessages, 'tasks.likes')) {
            throw new Error(`${moduleName}, critical error: push messages config has no tasks.likes property`);
          }

          if (sails.config.custom.pushMessages.tasks.likes[0].callbackHelper == null) {
            throw new Error(`${moduleName}, critical error: push messages config tasks.likes has no callbackHelper`);
          }

          /**
           * Сюда нужно добавить проверку наличия и запуск хелперов:
           *    - beforeHelper
           *    - blockModifyHelper
           */

          let splitCallbackHelperRes = _.split(sails.config.custom.pushMessages.tasks.likes[0].callbackHelper, sails.config.custom.JUNCTION, 2);
          let callbackHelperBlock = splitCallbackHelperRes[0];
          let callbackHelperName = splitCallbackHelperRes[1];

          if (callbackHelperBlock && callbackHelperName) {

            /**
             * We managed to parse the specified callbackHelper and can perform it
             */

            await sails.helpers.pushMessages[callbackHelperBlock][callbackHelperName](inputs.client, sails.config.custom.pushMessages.tasks.likes[0], inputs.query);

          } else {
            throw new Error(`${moduleName}, critical error: could not parse callback helper name: 
            callbackHelperBlock: ${callbackHelperBlock}
            callbackHelperName: ${callbackHelperName}`);
          }



          /**
           * Сюда нужно добавить проверку наличия и запуск хелперов:
           *    - afterHelper
           */


        } else if(/^push_msg_tsk_lc_/i.test(inputs.query.data)) {

          /**
           * Задание на постановку лайков и оставление комментов
           */

          if (!_.has(sails.config.custom.pushMessages, 'tasks.likes_comments')) {
            throw new Error(`${moduleName}, critical error: push messages config has no tasks.likes_comments property`);
          }

          if (sails.config.custom.pushMessages.tasks.likes_comments[0].callbackHelper == null) {
            throw new Error(`${moduleName}, critical error: push messages config tasks.likes_comments has no callbackHelper`);
          }

          /**
           * Сюда нужно добавить проверку наличия и запуск хелперов:
           *    - beforeHelper
           *    - blockModifyHelper
           */

          let splitCallbackHelperRes = _.split(sails.config.custom.pushMessages.tasks.likes_comments[0].callbackHelper, sails.config.custom.JUNCTION, 2);
          let callbackHelperBlock = splitCallbackHelperRes[0];
          let callbackHelperName = splitCallbackHelperRes[1];

          if (callbackHelperBlock && callbackHelperName) {

            /**
             * We managed to parse the specified callbackHelper and can perform it
             */

            await sails.helpers.pushMessages[callbackHelperBlock][callbackHelperName](inputs.client, sails.config.custom.pushMessages.tasks.likes[0], inputs.query);

          } else {
            throw new Error(`${moduleName}, critical error: could not parse callback helper name: 
            callbackHelperBlock: ${callbackHelperBlock}
            callbackHelperName: ${callbackHelperName}`);
          }



          /**
           * Сюда нужно добавить проверку наличия и запуск хелперов:
           *    - afterHelper
           */


        } else {
          throw new Error(`${moduleName}: unknown task category, query.data: ${inputs.query.data}`);
        }

      } else {
        throw new Error(`${moduleName}: unknown callback prefix, query.data: ${inputs.query.data}`);
      }

      return exits.success({
        status: 'ok',
        message: 'PushMessages SupervisorCallback performed',
        payload: {},
      })

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
        }
      };

    }

  }

};


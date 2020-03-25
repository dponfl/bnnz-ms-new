"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'push-messages:supervisor-callback-joi';

module.exports = {


  friendlyName: 'push-messages:supervisor-callback-joi',


  description: 'Обработка callback_query относящихся к push messages',


  inputs: {

    params: {
      friendlyName: 'input params',
      description: 'input params',
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

    const schema = Joi.object({
      client: Joi.any().required(),
      query: Joi.any().required(),
    });

    try {

      const input = await schema.validateAsync(inputs.params);

      /**
       * Save the received callback query message
       */

      await sails.helpers.storage.messageSaveJoi({
        message_id: input.query.message.message_id || 0,
        callback_query_id: input.query.id || '',
        message: input.query.data,
        message_format: sails.config.custom.enums.messageFormat.PUSHCALLBACK,
        messenger: input.client.messenger,
        message_originator: sails.config.custom.enums.messageOriginator.CLIENT,
        client_id: input.client.id,
        client_guid: input.client.guid
      });


      /**
       * Определяем к какой категории push messages относиться callback
       * (пока реализованы только вариант обработки callback для задач (префикс push_msg_tsk_)
       */

      if (/^push_msg_tsk_/i.test(input.query.data)) {

        /**
         * Полученный callback относиться к типу заданий
         */

        /**
         * Определяем тип задания
         */

        if (/^push_msg_tsk_l_/i.test(input.query.data)) {

          /**
           * Задание на постановку лайков
           */

          if (!_.has(sails.config.custom.pushMessages, 'tasks.likes')) {
            throw new Error(`${moduleName}, critical error: push messages config has no tasks.likes property`);
          }

          if (!_.has(sails.config.custom.pushMessages, 'tasks.likes.messages')) {
            throw new Error(`${moduleName}, critical error: push messages config has no tasks.likes.messages property`);
          }

          if (sails.config.custom.pushMessages.tasks.likes.messages[0].callbackHelper == null) {
            throw new Error(`${moduleName}, critical error: push messages config tasks.likes has no callbackHelper`);
          }

          /**
           * Находим стартовый блок в групе блоков
           */

          let initialBlock = _.find(sails.config.custom.pushMessages.tasks.likes.messages,
            {initial: true});

          /**
           * Проверяем, что стартовый блок был успешно найден
           */

          if (initialBlock != null && initialBlock.id != null) {

            await sails.helpers.pushMessages.proceedPushMessageJoi({
              client: input.client,
              query: input.query,
              messageData: initialBlock,
            });

          } else {
            throw new Error(`${moduleName}, critical error: initial block not found: \n${JSON.stringify(sails.config.custom.pushMessages.tasks.likes.messages, null, 3)}`);
          }


        } else if(/^push_msg_tsk_lc_/i.test(input.query.data)) {

          /**
           * Задание на постановку лайков и оставление комментов
           */

          if (!_.has(sails.config.custom.pushMessages, 'tasks.comments_likes')) {
            throw new Error(`${moduleName}, critical error: push messages config has no tasks.comments_likes property`);
          }

          if (!_.has(sails.config.custom.pushMessages, 'tasks.comments_likes.messages')) {
            throw new Error(`${moduleName}, critical error: push messages config has no tasks.comments_likes.messages property`);
          }

          if (sails.config.custom.pushMessages.tasks.comments_likes.messages[0].callbackHelper == null) {
            throw new Error(`${moduleName}, critical error: push messages config tasks.comments_likes has no callbackHelper`);
          }

          /**
           * Находим стартовый блок в групе блоков
           */

          let initialBlock = _.find(sails.config.custom.pushMessages.tasks.comments_likes.messages,
            {initial: true});

          /**
           * Проверяем, что стартовый блок был успешно найден
           */

          if (initialBlock != null && initialBlock.id != null) {

            await sails.helpers.pushMessages.proceedPushMessageJoi({
              client: input.client,
              query: input.query,
              messageData: initialBlock,
            });

          } else {
            throw new Error(`${moduleName}, critical error: initial block not found: \n${JSON.stringify(sails.config.custom.pushMessages.tasks.comments_likes.messages, null, 3)}`);
          }

        } else {
          throw new Error(`${moduleName}: unknown task category, query.data: ${input.query.data}`);
        }

      } else {
        throw new Error(`${moduleName}: unknown callback prefix, query.data: ${input.query.data}`);
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
          payload: {
            error: e,
          },
        }
      };

    }

  }

};


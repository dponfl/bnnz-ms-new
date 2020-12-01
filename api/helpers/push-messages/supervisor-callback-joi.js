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

    let clientGuid;
    let accountGuid;

    let pushMessage;


    try {

      const input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});

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

      // TODO: Добавить вариант для обработки callback от Chat Blasts

      if (/^push_msg_tsk_/i.test(input.query.data)) {

        /**
         * Полученный callback относиться к типу заданий
         */

        const pushMessageName = currentAccount.service.push_message_name;

        const pushMessageGetParams = {
          pushMessageName,
        };

        const pushMessageGetRaw = await sails.helpers.storage.pushMessageGetJoi(pushMessageGetParams);

        if (pushMessageGetRaw.status !== 'ok') {
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'Wrong pushMessageGetJoi response',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.STORAGE_ERROR.name,
            payload: {
              pushMessageGetParams,
              pushMessageGetRaw,
            },
          });

        }

        pushMessage = pushMessageGetRaw.payload;

        /**
         * Определяем тип задания
         */

        if (/^push_msg_tsk_l_/i.test(input.query.data)) {

          /**
           * Задание на постановку лайков
           */

          if (!_.has(pushMessage, 'tasks.likes')) {
            // throw new Error(`${moduleName}, critical error: push messages config has no tasks.likes property`);

            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'Push messages config has no tasks.likes property',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
              payload: {
                pushMessage,
              },
            });

          }

          if (pushMessage.tasks.likes.callbackHelper == null) {
            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'Push messages config tasks.likes has no callbackHelper',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
              payload: {
                pushMessagesTasksLikes: pushMessage.tasks.likes,
              },
            });
          }

          /**
           * Находим стартовый блок в групе блоков
           */

          let initialBlock = pushMessage.tasks.likes;

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
            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'Push messages (tasks.likes): initial block not found',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
              payload: {
                pushMessagesTasksLikes: pushMessage.tasks.likes,
              },
            });
          }


        } else if(/^push_msg_tsk_lc_/i.test(input.query.data)) {

          /**
           * Задание на постановку лайков и оставление комментов
           */

          if (!_.has(pushMessage, 'tasks.likes_comments')) {
            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'Push messages config has no tasks.likes_comments property',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
              payload: {
                pushMessage,
              },
            });
          }

          if (pushMessage.tasks.likes_comments.callbackHelper == null) {
            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'Push messages config tasks.likes_comments has no callbackHelper',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
              payload: {
                pushMessagesTasksLikes: pushMessage.tasks.likes_comments,
              },
            });
          }

          /**
           * Находим стартовый блок в групе блоков
           */

          let initialBlock = pushMessage.tasks.likes_comments;

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
            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'Push messages (tasks.likes_comments): initial block not found',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
              payload: {
                pushMessagesTasksLikes: pushMessage.tasks.likes_comments,
              },
            });
          }

        } else {
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'Unknown task category',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
            payload: {
              queryData: input.query.data,
            },
          });
        }

      }
      else if (/^push_msg_cb_/i.test(input.query.data)) {

        /**
         * Полученный callback относиться к типу Chat Blasts
         */

        const queryDataRegExp = /^push_msg_cb_(\S+)/;

        const queryData = queryDataRegExp.exec(input.query.data);

        if (queryData == null || queryData.length !== 2) {
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'query.data has wrong format',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
            payload: {
              queryData: input.query.data,
            },
          });
        }

        const callBackParams = _.split(queryData[1], '_', 3);

        if (callBackParams.length !== 3) {
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'Chat Blast callback params string has wrong format',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
            payload: {
              queryData: input.query.data,
              paramsStr: queryData[1],
              callBackParams,
            },
          });
        }

        const chatBlastGuid = callBackParams[0];
        const elementId = callBackParams[1];
        const buttonId = callBackParams[2];

        const chatBlastsPerforamceGetParams = {
          guid: chatBlastGuid,
          done: false,
          deleted: false,
        };

        const chatBlastsPerformanceRaw = await sails.helpers.storage.chatBlastsPerformanceGetByCriteriaJoi({
          criteria: chatBlastsPerforamceGetParams,
        });

        if (chatBlastsPerformanceRaw.status !== 'ok') {
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'Wrong chatBlastsPerformanceGetByCriteria response',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.STORAGE_ERROR.name,
            payload: {
              chatBlastsPerforamceGetParams,
              chatBlastsPerformanceRaw,
            },
          });
        }

        if (chatBlastsPerformanceRaw.payload.length !== 1) {
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'Several or none chatBlastsPerformance records for criteria',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.STORAGE_ERROR.name,
            payload: {
              chatBlastsPerforamceGetParams,
              chatBlastsPerformanceRaw,
            },
          });
        }

        const chatBlastsPerformanceRec = chatBlastsPerformanceRaw.payload;

        const chatBlastsElem = _.find(chatBlastsPerformanceRec.actionsList, {id: elementId});

        if (chatBlastsElem == null) {

          /**
           * Не можем найти элемент по указанному значению
           */

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: sails.config.custom.CHAT_BLASTS_ERROR_NO_ELEMENT.message,
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.CHAT_BLASTS_ERROR_NO_ELEMENT.name,
            payload: {
              chatBlastsPerformanceRec_actionsList: chatBlastsPerformanceRec.actionsList,
              elementId,
            },
          });

        }

        await sails.helpers.pushMessages.proceedChatBlastsCallbackJoi({
          client: input.client,
          messageData: chatBlastsElem,
          chatBlastsPerformanceRec,
          buttonId,
        });


      } else {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Unknown callback prefix',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
          payload: {
            queryData: input.query.data,
          },
        });
      }

      return exits.success({
        status: 'ok',
        message: 'PushMessages SupervisorCallback performed',
        payload: {},
      })

    } catch (e) {
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

  }

};


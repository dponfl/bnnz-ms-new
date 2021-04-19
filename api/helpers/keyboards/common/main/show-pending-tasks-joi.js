"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'keyboards:common:main:show-pending-tasks-joi';


module.exports = {


  friendlyName: 'keyboards:common:main:show-pending-tasks-joi',


  description: 'keyboards:common:main:show-pending-tasks-joi',


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
      client: Joi
        .any()
        .description('client object')
        .required(),
    });

    let input;

    let client;

    let clientGuid;
    let accountGuid;
    let currentAccount;

    let pendingTasks;

    let pushMessage;

    try {

      input = await schema.validateAsync(inputs.params);

      client = input.client;

      clientGuid = client.guid;
      accountGuid = client.account_use;

      /**
       * Устанавливаем флаг блокировки отправки сообщений
       */

      await sails.helpers.general.setClientDndJoi({
        clientGuid,
        accountGuid,
        dnd: true,
      });

      currentAccount = _.find(client.accounts, {guid: client.account_use});
      const currentAccountInd = _.findIndex(client.accounts, (o) => {
        return o.guid === currentAccount.guid;
      });

      /**
       * Достаём данные PushMessage
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
       * Отправляем сообщение, что начинаем проверку заданий
       */


      const messageDataPath = 'keyboards.main.pending_tasks_search';
      const messageData = _.get(pushMessage, messageDataPath, null);

      if (messageData == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'No expected messageData',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.STORAGE_ERROR.name,
          payload: {
            pushMessage,
            messageDataPath,
            messageData,
          },
        });
      }

      await sails.helpers.messageProcessor.sendMessageJoi({
        client,
        messageData,
        forced: true,
        skipMsgQueue: true,
      });

      /**
       * Проверяем наличие невыполненных заданий для аккаунта
       */

      /**
       * Первый уровень проверки - по данным записи аккаунта
       */

      if (currentAccount.requested_likes_total === currentAccount.made_likes_total
      && currentAccount.requested_comments_total === currentAccount.made_comments_total) {

        /**
         * Отправляем сообщение, что нет невыполненных заданий
         */

        const messageDataPath = 'keyboards.main.no_pending_tasks';
        const messageData = _.get(pushMessage, messageDataPath, null);

        if (messageData == null) {
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'No expected messageData',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.STORAGE_ERROR.name,
            payload: {
              pushMessage,
              messageDataPath,
              messageData,
            },
          });
        }

        await sails.helpers.messageProcessor.sendMessageJoi({
          client,
          messageData,
          forced: true,
        });

        /**
         * Сбрасываем флаг блокировки отправки сообщений
         */

        await sails.helpers.general.setClientDndJoi({
          clientGuid,
          accountGuid,
          dnd: false,
        });

        return exits.success({
          status: 'ok',
          message: `${moduleName} performed`,
          payload: {},
        })

      }

      /**
       * Второй уровень проверки - по данным таблицы Tasks
       */

      const pendingTasksGetParams = {
        or: [
          {
            accountGuid,
            makeLike: true,
            makeLikePerformed: false,
          },
          {
            accountGuid,
            makeComment: true,
            makeCommentPerformed: false,
          }
        ]
      }

      pendingTasks = await Tasks.find(pendingTasksGetParams)
        .tolerate(async (err) => {

          err.details = pendingTasksGetParams;

          await LogProcessor.dbError({
            error: err,
            message: 'Tasks.find() error',
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: pendingTasksGetParams,
          });

          return null;
        });

      if (pendingTasks == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Tasks.find() error',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.DB_ERROR_MEDIUM.name,
          payload: pendingTasksGetParams,
        });

      }

      if (pendingTasks.length > 0) {

        /**
         * Отправляем сообщение, что есть невыполненные задания
         */

        const beforeHelperParams = pendingTasks;

        const messageDataPath = 'keyboards.main.pending_tasks';
        const messageData = _.get(pushMessage, messageDataPath, null);

        if (messageData == null) {
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'No expected messageData',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.STORAGE_ERROR.name,
            payload: {
              pushMessage,
              messageDataPath,
              messageData,
            },
          });
        }

        await sails.helpers.messageProcessor.sendMessageJoi({
          client,
          messageData,
          beforeHelperParams,
          disableWebPagePreview: true,
          forced: true,
        });


      } else {

        // TODO: Отправить сообщение об ошибке с инфо о том, что:
        //  - по данным записи "accounts" все задания выполнены
        //  - по данным табл. Tasks есть невыполненные задания

        /**
         * Отправляем сообщение, что нет невыполненных заданий
         */

        const messageDataPath = 'keyboards.main.no_pending_tasks';
        const messageData = _.get(pushMessage, messageDataPath, null);

        if (messageData == null) {
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'No expected messageData',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.STORAGE_ERROR.name,
            payload: {
              pushMessage,
              messageDataPath,
              messageData,
            },
          });
        }

        await sails.helpers.messageProcessor.sendMessageJoi({
          client,
          messageData,
          forced: true,
        });

      }

      /**
       * Сбрасываем флаг блокировки отправки сообщений
       */

      await sails.helpers.general.setClientDndJoi({
        clientGuid,
        accountGuid,
        dnd: false,
      });

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      })

    } catch (e) {
      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          clientGuid,
          accountGuid,
          error: e,
          location: moduleName,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          clientGuid,
          accountGuid,
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


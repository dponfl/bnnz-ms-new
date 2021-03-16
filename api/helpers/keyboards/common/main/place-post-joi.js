"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'keyboards:common:main:place-post-joi';


module.exports = {


  friendlyName: 'keyboards:common:main:place-post-joi',


  description: 'keyboards:common:main:place-post-joi',


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

    let clientGuid;
    let accountGuid;
    let client;

    let currentAccount;

    let pushMessage;
    let messageDataPath;
    let messageData;


    try {

      input = await schema.validateAsync(inputs.params);

      client = input.client;

      clientGuid = client.guid;
      accountGuid = client.account_use;

      currentAccount = _.find(client.accounts, {guid: client.account_use});
      const currentAccountInd = _.findIndex(client.accounts, (o) => {
        return o.guid === currentAccount.guid;
      });

      /**
       * Устанавливаем флаг блокировки отправки сообщений
       */

      await sails.helpers.general.setClientDndJoi({
        clientGuid,
        accountGuid,
        dnd: true,
      });


      /**
       * Проверяем достижение порогового уровня невыполненных заданий
       */

      if (currentAccount.requested_likes_total !== currentAccount.made_likes_total
        || currentAccount.requested_comments_total !== currentAccount.made_comments_total) {

        /**
         * Отправляем инфо сообжение клиенту
         */

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

        messageDataPath = 'keyboards.main.pending_tasks_search_post';
        messageData = _.get(pushMessage, messageDataPath, null);

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
         * Подчитываем кол-во невыполненных заданий в терминах постов
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

        const pendingTasks = await Tasks.find(pendingTasksGetParams)
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

        const pendingTaskLimit = sails.config.custom.config.tasks.max_pending_tasks_before_post_blocking[currentAccount.service.name];

        if (pendingTaskLimit == null) {
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
            location: moduleName,
            message: 'Cannot find pending tasks limit',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.GENERAL_ERROR.name,
            payload: {
              serviceName: currentAccount.service.name,
              maxPendingTasksLimits: sails.config.custom.config.tasks.max_pending_tasks_before_post_blocking,
            },
          });
        }

        /**
         * Если pendingTaskLimit === 0 значит лимиты проверять не нужно
         * (например для звёзд)
         */

        if (pendingTaskLimit > 0 && pendingTasks.length >= pendingTaskLimit) {

          /**
           * Клиент достиг/превысил лимит невыполненных заданий
           */

          messageDataPath = 'keyboards.main.pending_tasks_over_limit_start';
          messageData = _.get(pushMessage, messageDataPath, null);

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
           * Отрправляем сообщение со списком невыполненных заданий
           * и кнопкой проверки выполнения заданий
           */

          const beforeHelperParams = pendingTasks;

          messageDataPath = 'keyboards.main.pending_tasks_over_limit_main';
          messageData = _.get(pushMessage, messageDataPath, null);

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


      }

      /**
       * Update General funnel to the initial state to enable the client to perform it again
       */

      const loadInitialFunnelsJoiParams = {
        client,
        clientCategory: client.accounts[currentAccountInd]['service']['funnel_name'],
        funnelName: 'main',
      };

      const loadInitialFunnelsJoiRaw = await sails.helpers.general.loadInitialFunnelsJoi(loadInitialFunnelsJoiParams);

      if (loadInitialFunnelsJoiRaw.status !== 'ok') {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Wrong loadInitialFunnelsJoi response',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.KEYBOARDS_ERROR.name,
          payload: {
            loadInitialFunnelsJoiParams,
            loadInitialFunnelsJoiRaw,
          },
        });
      }

      client = loadInitialFunnelsJoiRaw.payload.client;

      currentAccount = _.find(client.accounts, {guid: client.account_use});

      currentAccount.keyboard = null;

      /**
       * Установить в client, что выполняется воронка "main"
       */

      client.current_funnel = 'main';

      const initialBlock = _.find(client.funnels[client.current_funnel],
        {initial: true});

      initialBlock.enabled = true;

      await sails.helpers.funnel.proceedNextBlockJoi({
        client,
        funnelName: client.current_funnel,
        blockId: "provide_post_link",
        createdBy: moduleName,
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


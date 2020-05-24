"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'tasks:generate-tasks-joi';


module.exports = {


  friendlyName: 'tasks:generate-tasks-joi',


  description: 'Generate tasks and perform other related activities',


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

    /**
     * Input data schema
     */

    const schema = Joi.object({
      client: Joi
        .any()
        .required(),
      postLink: Joi
        .string()
        .pattern(RegExp(sails.config.custom.config.general.instagram_post_prefix))
        .required(),
    });

    let accountsListDraft = [];
    let accountsList = [];

    try {

      const input = await schema.validateAsync(inputs.params);

      /**
       * Получаем текущий аккаунт клиента
       */

      const account = _.find(input.client.accounts, {guid: input.client.account_use});

      if (account == null) {
        sails.log.error(`${moduleName}, error: Cannot get account in use from client record:
        ${JSON.stringify(input.client)}`);
        throw new Error(`${moduleName}, error: Cannot get account in use from client record:
        ${JSON.stringify(input.client)}`);
      }

      /**
       * Проверяем, что этот аккаунт имеет активную подписку
       */

      if (!account.subscription_active) {
        sails.log.error(`${moduleName}, error: Account has no active subscription:
        account: ${JSON.stringify(account)}`);
        throw new Error(`${moduleName}, error: Account has not active subscription:
        account: ${JSON.stringify(account)}`);
      }

      /**
       * Проверяем, что аккаунт на превысил суточные лимиты отправки постов
       */

      if (account.posts_made_day >= account.service.max_outgoing_posts_day) {
        sails.log.error(`${moduleName}, error: Max amount of outgoing posts reached:
          posts_made_day: ${account.posts_made_day},
          max_outgoing_posts_per_day: ${account.service.max_outgoing_posts_day}`);
        throw new Error(`${moduleName}, error: Max amount of outgoing posts reached:
          posts_made_day: ${account.posts_made_day},
          max_outgoing_posts_per_day: ${account.service.max_outgoing_posts_day}`);
      }

      /**
       * Создаём запись в таблице Posts
       */

      const postRecRaw = await sails.helpers.storage.postsCreateJoi({
        clientGuid: input.client.guid,
        accountGuid: account.guid,
        postLink: input.postLink,
      });

      const postRec = postRecRaw.payload;

      /**
       * Получаем список всех активных аккаунтов (accountsListRaw),
       * которые находятся в тех же комнатах, в которых размещен input.accountId
       * и у которых не исчерпаны суточные лимиты на получение постов
       */

      const accountRoomsList = [];

      for (const room of account.room) {
        if (room.active) {
          accountRoomsList.push(room.id);
        }
      }

      const accountsListRaw = await sails.helpers.storage.getAccountsByRooms(accountRoomsList);

      if (accountsListRaw.status === 'ok') {

        /**
         * Удаляем из списка аккаунт, отправивший пост
         */

        accountsListDraft = _.filter(accountsListRaw.payload, (acc) => {
          return acc.guid !== account.guid;
        });
      }

      /**
       * Убираем дубликаты аккаунтов
       */

      accountsList = _.uniqBy(accountsListDraft, 'id');

      /**
       * Для каждого аккаунта из accountsList
       * нужно сформировать задание и отправить соответствующее сообщение
       */

      for (const acc of accountsList) {

        const taskTypeRaw = await sails.helpers.tasks.generateTaskType();
        const taskType = taskTypeRaw.payload;

        const taskRecRaw = await sails.helpers.storage.tasksCreateJoi({
          clientGuid: acc.client.guid,
          accountGuid: acc.guid,
          postGuid: postRec.guid,
          messenger: acc.client.messenger,
          makeLike: true,
          makeComment: taskType === sails.config.custom.config.tasks.task_types.LIKE_AND_COMMENT,
        });

        await sails.helpers.storage.postsUpdateJoi({
          criteria: {guid: postRec.guid},
          data: {
            requestedLikes: ++postRec.requestedLikes,
            requestedComments: taskType === sails.config.custom.config.tasks.task_types.LIKE_AND_COMMENT
              ? ++postRec.requestedComments
              : postRec.requestedComments,
          }
        });

        /**
         * Отправляем пуш-сообщение в соответствии с типом задания
         */

        let msgRes;

        switch (taskType) {
          case sails.config.custom.config.tasks.task_types.LIKE:
            msgRes = await sails.helpers.messageProcessor.sendMessageJoi({
              client: acc.client,
              messageData: sails.config.custom.pushMessages.tasks.likes.messages[0],
              additionalTokens: [
                {
                  token: '$PostLink$',
                  value: input.postLink,
                },
                {
                  token: '$CurrentAccount$',
                  value: acc.inst_profile,
                },
              ],
              blockModifyHelperParams: {
                taskGuid: taskRecRaw.payload.guid || '',
              },
            });
            break;
          case sails.config.custom.config.tasks.task_types.LIKE_AND_COMMENT:
            msgRes = await sails.helpers.messageProcessor.sendMessageJoi({
              client: acc.client,
              messageData: sails.config.custom.pushMessages.tasks.likes_comments.messages[0],
              additionalTokens: [
                {
                  token: '$PostLink$',
                  value: input.postLink,
                },
                {
                  token: '$CurrentAccount$',
                  value: acc.inst_profile,
                },
              ],
              blockModifyHelperParams: {
                taskGuid: taskRecRaw.payload.guid || '',
              },
            });
            break;
          default:
            throw new Error(`${moduleName}, error: Unknown task type: ${taskType}`);
        }

        await sails.helpers.storage.tasksUpdateJoi({
          criteria: {
            guid: taskRecRaw.payload.guid,
          },
          data: {
            messageId: msgRes.payload.message_id || null,
          }
        });

        await sails.helpers.storage.accountUpdateJoi({
          criteria: {guid: acc.guid},
          data: {
            posts_received_day: ++acc.posts_received_day,
            posts_received_total: ++acc.posts_received_total,
          },
          createdBy: moduleName,
        });

      }

      await sails.helpers.storage.accountUpdateJoi({
        criteria: {guid: account.guid},
        data: {
          posts_made_day: ++account.posts_made_day,
          posts_made_total: ++account.posts_made_total,
        },
        createdBy: moduleName,
      });

      return exits.success({
        status: 'ok',
        message: 'Generate tasks performed',
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


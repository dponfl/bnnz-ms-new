"use strict";

const uuid = require('uuid-apikey');

const moduleName = 'tasks:generate-tasks';


module.exports = {


  friendlyName: 'tasks:generate-tasks',


  description: 'Generate tasks and perform other related activities',


  inputs: {

    client: {
      friendlyName: 'client',
      description: 'Client record',
      type: 'ref',
      required: true,
    },
    postLink: {
      friendlyName: 'postLink',
      description: 'postLink',
      type: 'string',
      required: true,
    },
    requestedLikes: {
      friendlyName: 'requestedLikes',
      description: 'requestedLikes',
      type: 'number',
    },
    requestedComments: {
      friendlyName: 'requestedComments',
      description: 'requestedComments',
      type: 'number',
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

    sails.log.info(`*************** ${moduleName} ***************`);

    let requested_likes = 0;
    let requested_comments = 0;
    let accountsList = [];

    try {

      /**
       * Получаем текущий аккаунт клиенгта
       */

      const account = _.find(inputs.client.accounts, {guid: inputs.client.account_use});

      if (account == null) {
        sails.log.error(`${moduleName}, error: Cannot get account in use from client record:
        ${JSON.stringify(inputs.client)}`);
        throw new Error(`${moduleName}, error: Cannot get account in use from client record:
        ${JSON.stringify(inputs.client)}`);
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

      if (account.posts_made_day >= account.service.max_outgoing_posts_per_day) {
        sails.log.error(`${moduleName}, error: Max amount of outgoing posts reached
          posts_made_day: ${account.posts_made_day},
          max_outgoing_posts_per_day: ${account.service.max_outgoing_posts_per_day}`);
        throw new Error(`${moduleName}, error: Max amount of outgoing posts reached
          posts_made_day: ${account.posts_made_day},
          max_outgoing_posts_per_day: ${account.service.max_outgoing_posts_per_day}`);
      }

      /**
       * Создаём запись в таблице Posts
       */

      const postRecRaw = await sails.helpers.storage.postsCreateJoi({
        clientGuid: inputs.client.guid,
        accountGuid: inputs.account.guid,
        postLink: inputs.postLink,
      });

      const postRec = postRecRaw.payload;

      /**
       * Получаем список всех активных аккаунтов (accountsList),
       * которые находятся в тех же комнатах, в которых размещен inputs.accountId
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

        accountsList = _.filter(accountsListRaw.payload, (acc) => {
          return acc.guid !== account.guid;
        });
      }

      /**
       * Для каждого аккаунта из accountsList
       * нужно сформировать задание и отправить соответствующее сообщение
       */

      let accountUpdateRes;

      for (const acc of accountsList) {

        const taskType = await sails.helpers.tasks.generateTaskType().payload;

        const taskRecRaw = await sails.helpers.storage.tasksCreate.with({
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
            msgRes = await sails.helpers.messageProcessor.sendMessage.with({
              client: acc.client,
              messageData: sails.config.custom.pushMessages.tasks.likes.messages[0],
              additionalTokens: [
                {
                  token: '$PostLink$',
                  value: inputs.postLink,
                },
              ],
            });
            break;
          case sails.config.custom.config.tasks.task_types.LIKE_AND_COMMENT:
            msgRes = await sails.helpers.messageProcessor.sendMessage.with({
              client: acc.client,
              messageData: sails.config.custom.pushMessages.tasks.likes_comments.messages[0],
              additionalTokens: [
                {
                  token: '$PostLink$',
                  value: inputs.postLink,
                },
              ],
            });
            break;
          default:
            throw new Error(`${moduleName}, error: Unknown task type: ${taskType}`);
        }

        await sails.helpers.storage.accountUpdate.with({
          criteria: {guid: acc.guid},
          data: {
            posts_received_day: ++acc.posts_received_day,
            posts_received_total: ++acc.posts_received_total,
          }
        });

      }

      await sails.helpers.storage.accountUpdate.with({
        criteria: {guid: account.guid},
        data: {
          posts_made_day: ++account.posts_made_day,
          posts_made_total: ++account.posts_made_total,
        }
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


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
    accountId: {
      friendlyName: 'accountId',
      description: 'accountId',
      type: 'number',
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
       * Проверяем, что переданный объект клиента имеет аккаун
       * с переданным inputs.accountId
       */

      const account = inputs.client.accounts[inputs.accountId];

      if (account == null) {
        sails.log.error(`${moduleName}, error: Cannot find account by input.accountId`);
        throw new Error(`${moduleName}, error: Cannot find account by input.accountId`);
      }

      /**
       * Проверяем, что этот аккаунт имеет активную подписку
       */

      if (!account.subscription_active) {
        sails.log.error(`${moduleName}, error: Account has no active subscription:
        accountId: ${inputs.accountId}
        subscription_active: ${account.subscription_active}`);
        throw new Error(`${moduleName}, error: Account has not active subscription:
        accountId: ${inputs.accountId}
        subscription_active: ${account.subscription_active}`);
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

      const uuidApiKey = uuid.create();

      const postRec = {
        guid: uuidApiKey.uuid,
        client_guid: inputs.client.guid,
        account_guid: inputs.accountId,
        link: inputs.postLink,
        total_likes: 0,
        total_dislikes: 0,
        requested_likes: inputs.requestedLikes || 0,
        requested_comments: inputs.requestedComments || 0,
        received_likes: 0,
        received_comments: 0,
        all_likes_done: false,
        all_comments_done: false,
      };

      const postRecRaw = await Posts.create(postRec).fetch();

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

      const accountsListRaw = await sails.helpers.storage.getClientsByRooms(accountRoomsList);

      if (accountsListRaw.status === 'ok') {
        accountsList = accountsListRaw.payload;
      }







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
          payload: {},
        }
      };

    }

  }

};


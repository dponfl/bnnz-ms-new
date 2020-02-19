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

      

      return exits.success({
        status: 'ok',
        message: 'Post record created',
        payload: postRecRaw,
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


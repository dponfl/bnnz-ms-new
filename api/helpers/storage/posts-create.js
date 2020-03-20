"use strict";

const uuid = require('uuid-apikey');

const moduleName = 'storage:postsCreate';


module.exports = {


  friendlyName: 'storage:postsCreate',


  description: 'Create posts record',


  inputs: {

    clientGuid: {
      friendlyName: 'client guid',
      description: 'client guid',
      type: 'string',
      required: true,
    },

    accountGuid: {
      friendlyName: 'account guid',
      description: 'Account guid',
      type: 'string',
      required: true,
    },

    postLink: {
      friendlyName: 'post link',
      description: 'post link',
      type: 'string',
      required: true,
    },

    totalLikes: {
      friendlyName: 'total_likes',
      description: 'total_likes',
      type: 'number',
    },

    totalDislikes: {
      friendlyName: 'total_dislikes',
      description: 'total_dislikes',
      type: 'number',
    },

    requestedLikes: {
      friendlyName: 'requested_likes',
      description: 'requested_likes',
      type: 'number',
    },

    requestedComments: {
      friendlyName: 'requested_comments',
      description: 'requested_comments',
      type: 'number',
    },

    receivedLikes: {
      friendlyName: 'received_likes',
      description: 'received_likes',
      type: 'number',
    },

    receivedComments: {
      friendlyName: 'received_comments',
      description: 'received_comments',
      type: 'number',
    },

    allLikesDone: {
      friendlyName: 'all_likes_done',
      description: 'all_likes_done',
      type: 'boolean',
    },

    allCommentsDone: {
      friendlyName: 'all_comments_done',
      description: 'all_comments_done',
      type: 'boolean',
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

      const uuidApiKey = uuid.create();

      const postRec = {
        guid: uuidApiKey.uuid,
        clientGuid: inputs.clientGuid,
        accountGuid: inputs.accountGuid,
        postLink: inputs.postLink,
        totalLikes: inputs.totalLikes || 0,
        totalDislikes: inputs.totalDislikes || 0,
        requestedLikes: inputs.requestedLikes || 0,
        requestedComments: inputs.requestedComments || 0,
        receivedLikes: inputs.receivedLikes || 0,
        receivedComments: inputs.receivedComments || 0,
        allLikesDone: inputs.allLikesDone || false,
        allCommentsDone: inputs.allCommentsDone || false,
      };

      const postRecRaw = await Posts.create(postRec).fetch();

      return exits.success({
        status: 'ok',
        message: 'Posts record created',
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


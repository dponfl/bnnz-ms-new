"use strict";

const uuid = require('uuid-apikey');

const moduleName = 'storage:tasksCreate';


module.exports = {


  friendlyName: 'storage:tasksCreate',


  description: 'Create tasks record',


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

    postGuid: {
      friendlyName: 'post guid',
      description: 'post guid',
      type: 'string',
      required: true,
    },

    messenger: {
      friendlyName: 'messenger',
      description: 'messenger',
      type: 'string',
      required: true,
    },

    messageId: {
      friendlyName: 'message_id',
      description: 'message_id',
      type: 'string',
    },

    makeLike: {
      friendlyName: 'make_like',
      description: 'make_like',
      type: 'boolean',
    },

    makeComment: {
      friendlyName: 'make_comment',
      description: 'make_comment',
      type: 'boolean',
    },

    makeLikePerformed: {
      friendlyName: 'make_like_performed',
      description: 'make_like_performed',
      type: 'boolean',
    },

    makeCommentPerformed: {
      friendlyName: 'make_comment_performed',
      description: 'make_comment_performed',
      type: 'boolean',
    },

    commentText: {
      friendlyName: 'comment_text',
      description: 'comment_text',
      type: 'string',
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

      const taskRec = {
        guid: uuidApiKey.uuid,
        post_guid: inputs.postGuid,
        client_guid: inputs.clientGuid,
        account_guid: inputs.accountGuid,
        messenger: inputs.messenger,
        message_id: inputs.messageId || null,
        make_like: inputs.makeLike || false,
        make_comment: inputs.makeComment || false,
        make_like_performed: inputs.makeLikePerformed || false,
        make_comment_performed: inputs.makeCommentPerformed || false,
        comment_text: inputs.commentText || null,
      };

      const taskRecRaw = await Tasks.create(taskRec).fetch();

      return exits.success({
        status: 'ok',
        message: 'Tasks record created',
        payload: taskRecRaw,
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


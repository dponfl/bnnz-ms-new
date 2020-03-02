"use strict";

const uuid = require('uuid-apikey');

const moduleName = 'storage:tasks-get';


module.exports = {


  friendlyName: 'storage:tasks-get',


  description: 'Get tasks records',


  inputs: {

    taskGuid: {
      friendlyName: 'task guid',
      description: 'task guid',
      type: 'string',
    },

    clientGuid: {
      friendlyName: 'client guid',
      description: 'client guid',
      type: 'string',
    },

    accountGuid: {
      friendlyName: 'account guid',
      description: 'Account guid',
      type: 'string',
    },

    postGuid: {
      friendlyName: 'post guid',
      description: 'post guid',
      type: 'string',
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

    otherConditions: {
      friendlyName: 'Other search conditions',
      description: 'Other search conditions',
      type: 'ref',
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

    let searchConditions = {};

    try {

      if (_.isNil(inputs.taskGuid)
        && _.isNil(inputs.clientGuid)
        && _.isNil(inputs.accountGuid)
        && _.isNil(inputs.postGuid)
        && _.isNil(inputs.messageId)
        && _.isNil(inputs.makeLike)
        && _.isNil(inputs.makeComment)
        && _.isNil(inputs.makeLikePerformed)
        && _.isNil(inputs.makeCommentPerformed)
      ) {
        throw new Error(`${moduleName} error: No search conditions provided, inputs: ${inputs}`);
      }

      if (_.has(inputs, 'taskGuid')
        && inputs.taskGuid
        && uuid.isUUID(inputs.taskGuid)
      ) {
        searchConditions['guid'] =  inputs.taskGuid;
      }

      if (_.has(inputs, 'clientGuid')
        && inputs.clientGuid
        && uuid.isUUID(inputs.clientGuid)
      ) {
        searchConditions['client_guid'] =  inputs.clientGuid;
      }

      if (_.has(inputs, 'accountGuid')
        && inputs.accountGuid
        && uuid.isUUID(inputs.accountGuid)
      ) {
        searchConditions['account_guid'] =  inputs.accountGuid;
      }

      if (_.has(inputs, 'postGuid')
        && inputs.postGuid
        && uuid.isUUID(inputs.postGuid)
      ) {
        searchConditions['post_guid'] =  inputs.postGuid;
      }

      if (_.has(inputs, 'messageId')
        && inputs.messageId
      ) {
        searchConditions['message_id'] =  inputs.messageId;
      }

      if (_.has(inputs, 'makeLike')
        && inputs.makeLike
      ) {
        searchConditions['make_like'] =  inputs.makeLike;
      }

      if (_.has(inputs, 'makeComment')
        && inputs.makeComment
      ) {
        searchConditions['make_comment'] =  inputs.makeComment;
      }

      if (_.has(inputs, 'makeLikePerformed')
        && inputs.makeLikePerformed
      ) {
        searchConditions['make_like_performed'] =  inputs.makeLikePerformed;
      }

      if (_.has(inputs, 'makeCommentPerformed')
        && inputs.makeCommentPerformed
      ) {
        searchConditions['make_comment_performed'] =  inputs.makeCommentPerformed;
      }

      if (!_.isNil(inputs.otherConditions)) {

        searchConditions = _.assignIn(searchConditions, inputs.otherConditions);

      }

      const taskRec = await Tasks.find({where: searchConditions});

      return exits.success({
        status: 'ok',
        message: 'Tasks record(s) found',
        payload: taskRec, // array of objects
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


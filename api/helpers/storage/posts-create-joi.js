"use strict";

const Joi = require('@hapi/joi');
const uuid = require('uuid-apikey');

const moduleName = 'storage:postsCreateJoi';


module.exports = {


  friendlyName: 'storage:postsCreateJoi',


  description: 'Create posts record',


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
      clientGuid: Joi.string().guid().required(),
      accountGuid: Joi.string().guid().required(),
      postLink: Joi.string()
        .pattern(RegExp(sails.config.custom.config.general.instagram_post_prefix)).required(),
      totalLikes: Joi.number().integer().min(0),
      totalDislikes: Joi.number().integer().min(0),
      requestedLikes: Joi.number().integer().min(0),
      requestedComments: Joi.number().integer().min(0),
      receivedLikes: Joi.number().integer().min(0),
      receivedComments: Joi.number().integer().min(0),
      allLikesDone: Joi.boolean(),
      allCommentsDone: Joi.boolean(),
    });

    try {

      const input = await schema.validateAsync(inputs.params);

      const uuidApiKey = uuid.create();

      const postRec = {
        guid: uuidApiKey.uuid,
        clientGuid: input.clientGuid,
        accountGuid: input.accountGuid,
        postLink: input.postLink,
        totalLikes: input.totalLikes || 0,
        totalDislikes: input.totalDislikes || 0,
        requestedLikes: input.requestedLikes || 0,
        requestedComments: input.requestedComments || 0,
        receivedLikes: input.receivedLikes || 0,
        receivedComments: input.receivedComments || 0,
        allLikesDone: input.allLikesDone || false,
        allCommentsDone: input.allCommentsDone || false,
      };

      // const postRecRaw = await Posts.create(postRec).fetch();
      await Posts.create(postRec);

      return exits.success({
        status: 'ok',
        message: 'Posts record created',
        payload: postRec,
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


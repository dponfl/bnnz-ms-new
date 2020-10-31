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
      clientGuid: Joi
        .string()
        .description('client guid')
        .guid()
        .required(),
      accountGuid: Joi
        .string()
        .description('account guid')
        .guid()
        .required(),
      postLink: Joi
        .string()
        .description('link to the post')
        .pattern(RegExp(sails.config.custom.postRegExp))
        .required(),
      shortCode: Joi
        .string()
        .description('post shortcode')
        .required(),
      mediaId: Joi
        .string()
        .description('mediaId of the post')
        .required(),
      totalLikes: Joi
        .number()
        .description('количество внутренних лайков')
        .integer()
        .min(0),
      totalDislikes: Joi
        .number()
        .description('количество внутренних дизлайков')
        .integer()
        .min(0),
      requestedLikes: Joi
        .number()
        .description('количество созданных заданий на лайки')
        .integer()
        .min(0),
      requestedComments: Joi
        .number()
        .description('количество созданных заданий на комментарии')
        .integer()
        .min(0),
      receivedLikes: Joi
        .number()
        .description('количество полученных лайков')
        .integer()
        .min(0),
      receivedComments: Joi
        .number()
        .description('количество оставленных комментариев')
        .integer()
        .min(0),
      allLikesDone: Joi
        .boolean()
        .description('true если каждый аккаунт, кому было поручено поставил лайк'),
      allCommentsDone: Joi
        .boolean()
        .description('true если каждый аккаунт, кому было поручено оставил комментарий'),
    });

    try {

      const input = await schema.validateAsync(inputs.params);

      const uuidApiKey = uuid.create();

      const postRec = {
        guid: uuidApiKey.uuid,
        clientGuid: input.clientGuid,
        accountGuid: input.accountGuid,
        postLink: input.postLink,
        shortCode: input.shortCode,
        mediaId: input.mediaId,
        totalLikes: input.totalLikes || 0,
        totalDislikes: input.totalDislikes || 0,
        requestedLikes: input.requestedLikes || 0,
        requestedComments: input.requestedComments || 0,
        receivedLikes: input.receivedLikes || 0,
        receivedComments: input.receivedComments || 0,
        allLikesDone: input.allLikesDone || false,
        allCommentsDone: input.allCommentsDone || false,
      };

      await Posts.create(postRec)
        .tolerate(async (err) => {

          err.details = {
            postRec,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'Posts.create() error',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              postRec,
            },
          });

          return true;
        });

      return exits.success({
        status: 'ok',
        message: 'Posts record created',
        // payload: postRecRaw,
        payload: postRec,
    })

    } catch (e) {
      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
        });
        return exits.success({
          status: 'error',
          message: `${moduleName} performed`,
          payload: {},
        });
      }

    }

  }

};


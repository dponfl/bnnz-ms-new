"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'push-messages:common:main:before-helper-pending-tasks-over-limit-joi';

module.exports = {


  friendlyName: 'push-messages:common:main:before-helper-pending-tasks-over-limit-joi',


  description: 'push-messages:common:main:before-helper-pending-tasks-over-limit-joi',


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
        .description('Client record')
        .required(),
      messageContent: Joi
        .any()
        .description('{text, inline_keyboard, img, video, doc} object')
        .required(),
      additionalParams: Joi
        .any()
        .description('params'),
    });

    let clientGuid;
    let accountGuid;
    let client;



    try {

      const input = await schema.validateAsync(inputs.params);

      client = input.client;
      clientGuid = client.guid;
      accountGuid = client.account_use;

      const pendingTasks = input.additionalParams || [];

      let postsAndActions = '';

      const makeLikeStr = await MessageProcessor.parseStr({
        client,
        token: "COMMON_MAIN_PENDING_TASKS_MAKE_LIKE",
      });

      const putCommentStr01 = await MessageProcessor.parseStr({
        client,
        token: "COMMON_MAIN_PENDING_TASKS_PUT_COMMENT_01",
      });

      const putCommentStr02 = await MessageProcessor.parseStr({
        client,
        token: "COMMON_MAIN_PENDING_TASKS_PUT_COMMENT_02",
      });

      for (const pendingTask of pendingTasks) {

        /**
         * Вытаскиваем данные поста
         */

        const postRecRaw = await sails.helpers.storage.postsGetJoi({guid: pendingTask.postGuid});

        if (
          _.isArray(postRecRaw.payload)
          && postRecRaw.payload.length === 0
        ) {
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'No post found for this guid',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
            payload: {
              taskRecPostGuid: pendingTask.postGuid,
              postRecRaw,
            },
          });
        }

        if (postRecRaw.payload.length !== 1) {
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'More than one record for this guid',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
            payload: {
              taskRecPostGuid: pendingTask.postGuid,
              postRecRaw,
            },
          });
        }

        const postRec = postRecRaw.payload[0];

        if (pendingTask.makeLike
          && !pendingTask.makeLikePerformed
          && pendingTask.makeComment
          && !pendingTask.makeCommentPerformed) {
          postsAndActions = postsAndActions + `:point_right: ${postRec.postLink}${sails.config.custom.SCR}${makeLikeStr}${sails.config.custom.SCR}${putCommentStr01}${sails.config.custom.SCR}${putCommentStr02}${sails.config.custom.DCR}`;
        }
        else if (pendingTask.makeLike
          && !pendingTask.makeLikePerformed) {
          postsAndActions = postsAndActions + `:point_right: ${postRec.postLink}${sails.config.custom.SCR}${makeLikeStr}${sails.config.custom.DCR}`;
        }
        else if (pendingTask.makeComment
          && !pendingTask.makeCommentPerformed) {
          postsAndActions = postsAndActions + `:point_right: ${postRec.postLink}${sails.config.custom.SCR}${putCommentStr01}${sails.config.custom.SCR}${putCommentStr02}${sails.config.custom.DCR}`;
        }

      }

      postsAndActions = await MessageProcessor.parseEmoji({
        str: postsAndActions,
      });

      const resHtml = await MessageProcessor.parseSpecialTokens({
        client,
        message: input.messageContent.text,
        additionalTokens: [
          {
            token: '$PendingTasks$',
            value: postsAndActions,
          },
        ],
      });


      return exits.success({
        text: resHtml,
        inline_keyboard: input.messageContent.inline_keyboard,
        img: input.messageContent.img,
        video: input.messageContent.video,
        doc: input.messageContent.doc,
      });

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
          status: 'ok',
          message: `${moduleName} not performed`,
          payload: {},
        });
      }
    }
  }
};


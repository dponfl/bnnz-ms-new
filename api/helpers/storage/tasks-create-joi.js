"use strict";

const uuid = require('uuid-apikey');
const Joi = require('@hapi/joi');

const moduleName = 'storage:tasksCreateJoi';


module.exports = {


  friendlyName: 'storage:tasksCreateJoi',


  description: 'Create tasks record',


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
      postGuid: Joi.string().guid().required(),
      messenger: Joi
        .string()
        .max(50)
        .valid(sails.config.custom.enums.messenger.TELEGRAM)
        .required(),
      messageId: Joi.string(),
      makeLike: Joi.boolean(),
      makeComment: Joi.boolean(),
      makeLikePerformed: Joi.boolean(),
      makeCommentPerformed: Joi.boolean(),
      commentText: Joi.string().max(8000),
    });

    try {

      const input = await schema.validateAsync(inputs.params);

      const uuidApiKey = uuid.create();

      const taskRec = {
        guid: uuidApiKey.uuid,
        postGuid: input.postGuid,
        clientGuid: input.clientGuid,
        accountGuid: input.accountGuid,
        messenger: input.messenger,
        messageId: input.messageId || null,
        makeLike: input.makeLike || false,
        makeComment: input.makeComment || false,
        makeLikePerformed: input.makeLikePerformed || false,
        makeCommentPerformed: input.makeCommentPerformed || false,
        commentText: input.commentText || null,
      };

      // const taskRecRaw = await Tasks.create(taskRec).fetch();
      await Tasks.create(taskRec)
        .tolerate(async (err) => {

          err.details = {
            taskRec,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'Tasks.create() error',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              taskRec,
            },
          });

          return true;
        });

      return exits.success({
        status: 'ok',
        message: 'Tasks record created',
        // payload: taskRecRaw,
        payload: taskRec,
      })

    } catch (e) {

      // const errorLocation = moduleName;
      // const errorMsg = `${moduleName}: General error`;
      //
      // sails.log.error(errorLocation + ', error: ' + errorMsg);
      // sails.log.error(errorLocation + ', error details: ', e);
      //
      // throw {err: {
      //     module: errorLocation,
      //     message: errorMsg,
      //     payload: {
      //       error: e,
      //     },
      //   }
      // };

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
          message: `${moduleName} performed`,
          payload: {},
        });
      }

    }

  }

};


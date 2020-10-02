"use strict";

const Joi = require('@hapi/joi');
const uuid = require('uuid-apikey');

const moduleName = 'storage:posts-get-joi';


module.exports = {


  friendlyName: 'storage:posts-get-joi',


  description: 'Get posts records',


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
      guid: Joi
        .string()
        .guid()
        .description('task guid'),
      clientGuid: Joi
        .string()
        .guid()
        .description('client guid'),
      accountGuid: Joi
        .string()
        .guid()
        .description('Account guid'),
      postLink: Joi
        .string()
        .description('link to the post')
        .pattern(RegExp(sails.config.custom.postRegExp)),
      allLikesDone: Joi
        .boolean()
        .description('true если каждый аккаунт, кому было поручено поставил лайк'),
      allCommentsDone: Joi
        .boolean()
        .description('true если каждый аккаунт, кому было поручено оставил комментарий'),
      otherConditions: Joi
        .any()
        .description('Other search conditions'),
    }).or(
      'guid',
      'clientGuid',
      'accountGuid',
      'postLink',
      'allLikesDone',
      'allCommentsDone',
    );


    let searchConditions = {};

    try {

      const input = await schema.validateAsync(inputs.params);

      _.forEach(input, (val, key) => {
        if (key !== 'otherConditions') {
          searchConditions[key] =  val;
        }
      });

      if (input.otherConditions != null) {
        searchConditions = _.assignIn(searchConditions, input.otherConditions);
      }

      const postRec = await Posts.find({where: searchConditions})
        .tolerate(async (err) => {

          err.details = {
            where: searchConditions,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'Posts.find() error',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              where: searchConditions,
            },
          });

          return [];
        });

      return exits.success({
        status: 'ok',
        message: 'Posts record(s) found',
        payload: postRec, // array of objects
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


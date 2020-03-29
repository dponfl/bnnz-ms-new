"use strict";

const Joi = require('@hapi/joi');
const uuid = require('uuid-apikey');

const moduleName = 'storage:tasks-get-joi';


module.exports = {


  friendlyName: 'storage:tasks-get-joi',


  description: 'Get tasks records',


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
      postGuid: Joi
        .string()
        .guid()
        .description('post guid'),
      messageId: Joi
        .string()
        .max(36)
        .description('messageId'),
      makeLike: Joi
        .boolean()
        .description('makeLike'),
      makeComment: Joi
        .boolean()
        .description('makeComment'),
      makeLikePerformed: Joi
        .boolean()
        .description('makeLikePerformed'),
      makeCommentPerformed: Joi
        .boolean()
        .description('makeCommentPerformed'),
      otherConditions: Joi
        .any()
        .description('Other search conditions'),
    }).or(
      'guid',
      'clientGuid',
      'accountGuid',
      'postGuid',
      'messageId',
      'makeLike',
      'makeComment',
      'makeLikePerformed',
      'makeCommentPerformed',
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
          payload: {
            error: e,
          },
        }
      };

    }

  }

};


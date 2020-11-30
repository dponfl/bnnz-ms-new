"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'storage:chat-blasts-performance-get-by-criteria-joi';


module.exports = {


  friendlyName: 'storage:chat-blasts-performance-get-by-criteria-joi',


  description: 'storage:chat-blasts-performance-get-by-criteria-joi',


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
      criteria: Joi
        .any()
        .description('search criteria')
        .required(),
    });

    let input;
    let chatBlastsArray;

    try {

      input = await schema.validateAsync(inputs.params);

      chatBlastsArray = await ChatBlastsPerformance.find({
        where: input.criteria,
      })
        .tolerate(async (err) => {

          err.details = {
            where: input.criteria,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'ChatBlastsPerformance.find() error',
            location: moduleName,
            payload: {
              where: input.criteria,
            },
          });

          return [];
        });

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: chatBlastsArray, // array of record objects of empty array
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
          status: 'ok',
          message: `${moduleName} performed`,
          payload: {},
        });
      }
    }

  }

};


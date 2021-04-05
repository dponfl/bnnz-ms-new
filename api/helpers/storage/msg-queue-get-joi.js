"use strict";

const Joi = require('@hapi/joi');
const uuid = require('uuid-apikey');

const moduleName = 'storage:msg-queue-get-joi';


module.exports = {


  friendlyName: 'storage:msg-queue-get-joi',


  description: 'storage:msg-queue-get-joi',


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
      limit: Joi
        .number()
        .integer()
        .positive()
        .default(1000000),
    });

    let input;

    let messageRec;

    try {

      input = await schema.validateAsync(inputs.params);

      messageRec = await MsgQueue.find({
        where: input.criteria,
      })
        .limit(input.limit)
        .tolerate(async (err) => {

          err.details = {
            where: input.criteria,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'MsgQueue.find() error',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              where: input.criteria,
            },
          });

          return [];
        });

      return exits.success({
        status: 'success',
        message: `${moduleName} performed`,
        payload: messageRec,
      })

    } catch (e) {

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
          errorPayloadAdditional: {
            criteria: input.criteria,
          },
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            criteria: input.criteria,
          },
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


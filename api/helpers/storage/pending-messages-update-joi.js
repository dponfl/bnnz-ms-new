"use strict";

const Joi = require('@hapi/joi');
const uuid = require('uuid-apikey');

const moduleName = 'storage:pending-messages-update-joi';


module.exports = {


  friendlyName: 'storage:pending-messages-update-joi',


  description: 'storage:pending-messages-update-joi',


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
        .required()
        .description('Criteria to update record'),
      data: Joi
        .any()
        .required()
        .description('Data to update record'),
    });

    let input;


    try {

      input = await schema.validateAsync(inputs.params);

      await PendingMessages.update(input.criteria).set(input.data)
        .tolerate(async (err) => {

          err.details = {
            criteria: input.criteria,
            data: input.data,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'PendingMessages.update() error',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              criteria: input.criteria,
              data: input.data,
            },
          });

          return true;
        });

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {
          criteria: input.criteria,
          data: input.data,
        },
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
            data: input.data,
          },
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            criteria: input.criteria,
            data: input.data,
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


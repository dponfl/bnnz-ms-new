"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'storage:ref-up-update-joi';

module.exports = {


  friendlyName: 'storage:ref-up-update-joi',


  description: 'storage:ref-up-update-joi',


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
        .description('Criteria to update record(s)'),
      data: Joi
        .any()
        .required()
        .description('Data to update record(s)'),
      createdBy: Joi
        .string()
        .description('source of update')
        .required(),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      await RefUp.update(input.criteria).set(input.data)
        .tolerate(async (err) => {

          err.details = {
            criteria: input.criteria,
            data: input.data,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'RefUp.update() error',
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
        payload: {},
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


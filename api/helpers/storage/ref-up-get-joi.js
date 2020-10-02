"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'storage:ref-up-get-joi';


module.exports = {


  friendlyName: 'storage:ref-up-get-joi',


  description: 'storage:ref-up-get-joi',


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
        .description('criteria to get records for')
        .required(),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      const refUpRecs = await RefUp.find({
        where: input.criteria,
      })
        .tolerate(async (err) => {

          err.details = {
            where: input.criteria,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'RefUp.find() error',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              where: input.criteria,
            },
          });

          return null;
        });

      if (refUpRecs == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: 'RefUp.find() error',
          // clientGuid,
          // accountGuid,
          errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
          payload: {
            where: input.criteria,
          },
        });
      }


      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: refUpRecs, // array of objects or an empty array
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


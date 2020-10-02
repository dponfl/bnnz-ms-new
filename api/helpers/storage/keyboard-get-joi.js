"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'storage:keyboard-get-joi';


module.exports = {


  friendlyName: 'storage:keyboard-get-joi',


  description: 'storage:keyboard-get-joi',


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
      keyboardName: Joi
        .string()
        .description('keyboard name')
        .required(),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      const keyboard = await Keyboards.findOne({
        active: true,
        name: input.keyboardName,
      })
        .tolerate(async (err) => {

          err.details = {
            active: true,
            name: input.keyboardName,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'Keyboards.findOne() error',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              active: true,
              name: input.keyboardName,
            },
          });

          return null;
        });

      if (keyboard == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
          location: moduleName,
          message: 'Keyboards.findOne() error',
          // clientGuid,
          // accountGuid,
          errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
          payload: {
            active: true,
            name: input.keyboardName,
          },
        });
      }

      if (keyboard.keyboard_data != null) {

        return exits.success({
          status: 'ok',
          message: 'Get keyboard data success',
          payload: keyboard.keyboard_data,
        })

      } else {

        return exits.success({
          status: 'nok',
          message: 'Get keyboard data error',
          payload: {},
        })

      }

    } catch (e) {

      // const errorMsg = 'General error';
      //
      // sails.log.error(`${moduleName}, Error details:
      // Platform error message: ${errorMsg}
      // Error name: ${e.name || 'no name'}
      // Error message: ${e.message || 'no message'}
      // Error stack: ${JSON.stringify(e.stack || {}, null, 3)}`);
      //
      // throw {err: {
      //     module: `${moduleName}`,
      //     message: errorMsg,
      //     payload: {
      //       error_name: e.name || 'no name',
      //       error_message: e.message || 'no message',
      //       error_stack: e.stack || {},
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


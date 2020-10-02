"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'message-processor:push-message-get-joi';


module.exports = {


  friendlyName: 'message-processor:push-message-get-joi',


  description: 'Fetch push messages data from push_messages table',


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
      pushMessageName: Joi
        .string()
        .description('pushMessage name')
        .required(),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      const pushMessages = await PushMessages.findOne({
        active: true,
        name: input.pushMessageName,
      })
        .tolerate(async (err) => {

          err.details = {
            active: true,
            name: input.pushMessageName,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'PushMessages.findOne() error',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              active: true,
              name: input.pushMessageName,
            },
          });

          return null;
        });

      if (pushMessages == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
          location: moduleName,
          message: 'PushMessages.findOne() error',
          // clientGuid,
          // accountGuid,
          errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
          payload: {
            active: true,
            name: input.pushMessageName,
          },
        });
      }

      if (pushMessages.message_data != null) {

        return exits.success({
          status: 'ok',
          message: 'Push message data received',
          payload: pushMessages.message_data,
        })

      } else {

        return exits.success({
          status: 'nok',
          message: 'Push message data NOT received',
          payload: {},
        })

      }

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


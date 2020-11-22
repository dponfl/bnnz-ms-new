"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'storage:chat-blast-get-joi';


module.exports = {


  friendlyName: 'storage:chat-blast-get-joi',


  description: 'storage:chat-blast-get-joi',


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
      chatBlastName: Joi
        .string()
        .description('Chat Blast name')
        .required(),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      const chatBlast = await ChatBlasts.findOne({
        active: true,
        name: input.chatBlastName,
      })
        .tolerate(async (err) => {

          err.details = {
            active: true,
            name: input.chatBlastName,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'ChatBlasts.findOne() error',
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              active: true,
              name: input.chatBlastName,
            },
          });

          return null;
        });

      if (chatBlast == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
          location: moduleName,
          message: 'ChatBlasts.findOne() error',
          errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
          payload: {
            active: true,
            name: input.chatBlastName,
          },
        });
      }

      if (chatBlast.cb_data != null) {

        return exits.success({
          status: 'ok',
          message: 'Get Chat Blast data success',
          payload: chatBlast.cb_data,
        })

      } else {

        return exits.success({
          status: 'nok',
          message: 'Get Chat Blast data error',
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


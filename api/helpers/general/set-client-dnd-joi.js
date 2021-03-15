"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'general:set-client-dnd-joi';


module.exports = {


  friendlyName: 'general:set-client-dnd-joi',


  description: 'general:set-client-dnd-joi',


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
      clientGuid: Joi
        .string()
        .description('clientGuid')
        .guid()
        .required(),
      accountGuid: Joi
        .string()
        .description('accountGuid')
        .guid()
        .required(),
      dnd: Joi
        .boolean()
        .description('client dnd value')
        .required(),
    });

    let input;

    let clientGuid;
    let accountGuid;


    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.clientGuid;
      accountGuid = input.accountGuid;

      /**
       * Устанавливаем флаг блокировки отправки сообщений
       */

      const setDndParams = {
        criteria: {
          guid: clientGuid
        },
        data: {
          dnd: input.dnd,
        },
        createdBy: moduleName,
        makeClientFieldsRecord: false,
      }

      const setDnd = await sails.helpers.storage.clientUpdateJoi(setDndParams);

      if (setDnd.status == null
        || setDnd.status !== 'ok') {
        await LogProcessor.error({
          message: 'Wrong response from clientUpdateJoi',
          clientGuid,
          accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.DB_ERROR_MEDIUM.name,
          location: moduleName,
          payload: {
            setDndParams,
            setDnd,
          },
        });

        return exits.success({
          status: 'error',
          message: `${moduleName} not performed`,
          payload: {},
        })

      } else {

        return exits.success({
          status: 'ok',
          message: `${moduleName} performed`,
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
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
          },
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
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


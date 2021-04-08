"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'storage:msg-queue-create-wrapper';


module.exports = {


  friendlyName: 'storage:msg-queue-create-wrapper',


  description: 'storage:msg-queue-create-wrapper',


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
      msgQueueCreateParams: Joi
        .any()
        .description('msgQueueCreate params')
        .required(),
      createdBy: Joi
        .string()
        .description('source of update')
        .required(),
    });

    let input;

    let clientGuid;
    let accountGuid;
    let msgQueueCreateParams;
    let createdBy;


    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = _.get(input.msgQueueCreateParams, 'clientGuid', null);
      accountGuid = _.get(input.msgQueueCreateParams, 'accountGuid', null);

      msgQueueCreateParams = input.msgQueueCreateParams;
      createdBy = input.createdBy;

      if (
        _.isNil(clientGuid)
        || _.isNil(accountGuid)
      ) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
          location: moduleName,
          message: 'Missing clientGuid or accountGuid at msgQueueCreateParams',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            msgQueueCreateParams: input.msgQueueCreateParams,
            createdBy,
          },
        });
      }


      const msgQueueCreateRaw = await sails.helpers.storage.msgQueueCreateJoi(msgQueueCreateParams);

      if (
        _.isNil(msgQueueCreateRaw.status)
        || msgQueueCreateRaw.status !== 'success'
      ) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
          location: moduleName,
          message: 'Wrong msgQueueCreateJoi response status',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
          payload: {
            msgQueueCreateRaw,
            createdBy,
          },
        });
      }

      const msgQueueRec = _.get(msgQueueCreateRaw, 'payload', null);

      return exits.success(msgQueueRec);

    } catch (e) {

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          clientGuid,
          accountGuid,
          error: e,
          location: moduleName,
          throwError: true,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
            msgQueueCreateParams,
            createdBy,
          },
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          clientGuid,
          accountGuid,
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
            msgQueueCreateParams,
            createdBy,
          },
        });
        return exits.success({
          status: 'error',
          message: `${moduleName} not performed`,
          payload: {},
        });
      }

    }

  }

};


"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'storage:message-save-wrapper';


module.exports = {


  friendlyName: 'storage:message-save-wrapper',


  description: 'storage:message-save-wrapper',


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
      msgSaveParams: Joi
        .any()
        .description('messageSaveJoi params')
        .required(),
      createdBy: Joi
        .string()
        .description('source of update')
        .required(),
    });

    let input;

    let clientGuid;
    let accountGuid;
    let msgSaveParams;
    let createdBy;


    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = _.get(input.msgSaveParams, 'clientGuid', null);
      accountGuid = _.get(input.msgSaveParams, 'accountGuid', null);

      msgSaveParams = input.msgSaveParams;
      createdBy = input.createdBy;

      if (
        _.isNil(clientGuid)
        || _.isNil(accountGuid)
      ) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
          location: moduleName,
          message: 'Missing clientGuid or accountGuid at msgSaveParams',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            msgSaveParams: input.msgSaveParams,
            createdBy,
          },
        });
      }

      const msgSaveRaw = await sails.helpers.storage.messageSaveJoi(msgSaveParams);

      if (
        _.isNil(msgSaveRaw.status)
        || msgSaveRaw.status !== 'success'
        || _.isNil(msgSaveRaw.payload)
      ) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
          location: moduleName,
          message: 'Wrong messageSaveJoi response',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
          payload: {
            msgSaveParams,
            msgSaveRaw,
            createdBy,
          },
        });
      }

      const msgSaveRec = _.get(msgSaveRaw, 'payload', null);

      return exits.success(msgSaveRec);

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
            msgSaveParams,
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
            msgSaveParams,
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


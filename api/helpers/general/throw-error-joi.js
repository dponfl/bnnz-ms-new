"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'general:throw-error-joi';


module.exports = {


  friendlyName: 'general:throw-error-joi',


  description: 'general:throw-error-joi',


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
    },

    BFErrorExit: {
      description: 'BF customized error type 01',
    },

    BFErrorDetectedExit: {
      description: 'BF customized error type 02',
    },

  },


  fn: async function (inputs, exits) {

    const schema = Joi.object({
      errorType: Joi
        .string()
        .description('error type')
        .valid(
          sails.config.custom.enums.errorType.INFO,
          sails.config.custom.enums.errorType.WARN,
          sails.config.custom.enums.errorType.ERROR,
          sails.config.custom.enums.errorType.CRITICAL,
        )
        .required(),
      location: Joi
        .string()
        .description('error location')
        .required(),
      message: Joi
        .string()
        .description('error message')
        .required(),
      clientGuid: Joi
        .string()
        .description('client guid')
        .guid(),
      accountGuid: Joi
        .string()
        .description('account guid')
        .guid(),
      requestId: Joi
        .string()
        .description('request guid')
        .guid(),
      childRequestId: Joi
        .string()
        .description('child request guid')
        .guid(),
      errorName: Joi
        .string()
        .description('error name'),
      payload: Joi
        .any()
        .description('payload'),
      emergencyLevel: Joi
        .string()
        .description('error emergency level')
        .valid(
          sails.config.custom.enums.emergencyLevels.LOW,
          sails.config.custom.enums.emergencyLevels.MEDIUM,
          sails.config.custom.enums.emergencyLevels.HIGH,
          sails.config.custom.enums.emergencyLevels.HIGHEST,
        ),
    });

    const input = await schema.validateAsync(inputs.params);

    const location = input.location;
    const message = input.message;
    const payload = input.payload || {};

    payload.details = {};

    const errorParams = {
      message,
      location,
      errorName: input.errorName || 'ERR_GENERAL',
      payload,
    };

    if (input.clientGuid != null) {
      errorParams.clientGuid = input.clientGuid;
      _.assign(payload.details, {clientGuid: input.clientGuid})
    }

    if (input.accountGuid != null) {
      errorParams.accountGuid = input.accountGuid;
      _.assign(payload.details, {accountGuid: input.accountGuid})
    }

    if (input.requestId != null) {
      errorParams.requestId = input.requestId;
    }

    if (input.childRequestId != null) {
      errorParams.childRequestId = input.childRequestId;
    }

    if (input.emergencyLevel != null) {
      errorParams.emergencyLevel = input.emergencyLevel || sails.config.custom.enums.emergencyLevels.LOW;
    }


    switch (input.errorType) {
      case sails.config.custom.enums.errorType.INFO:
        await LogProcessor.info(errorParams);
        break;
      case sails.config.custom.enums.errorType.WARN:
        await LogProcessor.warn(errorParams);
        break;
      case sails.config.custom.enums.errorType.ERROR:
        await LogProcessor.error(errorParams);
        break;
      case sails.config.custom.enums.errorType.CRITICAL:
        await LogProcessor.critical(errorParams);
        break;
    }


    throw {
      BFErrorExit: {
        location,
        message,
        payload,
      }
    }

  }

};


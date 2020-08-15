"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'general:catch-error-joi';


module.exports = {


  friendlyName: 'general:catch-error-joi',


  description: 'general:catch-error-joi',


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
      error: Joi
        .any()
        .description('error')
        .required(),
      location: Joi
        .string()
        .description('error location')
        .required(),
      throwError: Joi
        .boolean()
        .description('true if we want to throw error further')
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
      errorPayloadAdditional: Joi
        .any()
        .description('error payload additional')
    });

    const input = await schema.validateAsync(inputs.params);

    let errorObj;
    if (input.error.code != null && input.error.code === 'E_INTERNAL_ERROR') {
      if (input.error.raw != null && _.isObject(input.error.raw)) {
        errorObj = input.error.raw;
      }
    } else {
      errorObj = input.error;
    }
    if (errorObj.code === 'BFErrorExit') {
      if (input.throwError) {
        throw {
          BFErrorExit: errorObj.raw != null ? errorObj.raw : {}
        }
      }
    } else if (errorObj.code === 'BFErrorDetectedExit') {
      if (input.throwError) {
        throw {
          BFErrorDetectedExit: errorObj.raw != null ? errorObj.raw : {}
        }
      }
    } else if (_.has(errorObj, 'BFErrorExit')) {
      if (input.throwError) {
        throw {
          BFErrorExit: errorObj.BFErrorExit != null ? errorObj.BFErrorExit : {}
        }
      }
    } else {
      const errorLocation = input.location;
      const errorPayloadAdditional = input.errorPayloadAdditional;
      const errorMsg = errorObj.message != null ? errorObj.message : 'No error message';
      const errorName = errorObj.name != null ? errorObj.name : 'No error name';
      const errorPayload = errorObj.raw != null ? errorObj.raw : {};
      const errorStack = errorObj.stack != null ? _.truncate(errorObj.stack, {
        length: 500,
        omission: ' [...]',
      }) : 'No error stack';

      if (errorObj.code === 'EPARSE' || errorObj.code === 'ETELEGRAM') {
        errorPayloadAdditional.response = (errorObj.response != null && errorObj.response.body != null) ? errorObj.response.body : {};
      }

      const error = {
        errorLocation,
        errorMsg,
        errorName,
        errorPayload,
        errorStack,
        errorPayloadAdditional,
      };
      await LogProcessor.error({
        message: errorMsg,
        // clientGuid,
        // accountGuid,
        // requestId: null,
        // childRequestId: null,
        errorName,
        location: errorLocation,
        payload: {
          errorPayload,
          errorStack,
          errorPayloadAdditional,
        },
      });
      if (input.throwError) {
        throw {
          BFErrorDetectedExit: {
            error,
          }
        };
      }
    }

    return exits.success({
      status: 'ok',
      message: `${moduleName} performed`,
      payload: {},
    });

  }

};


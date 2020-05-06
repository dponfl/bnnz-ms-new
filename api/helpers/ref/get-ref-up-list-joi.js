"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'ref:get-ref-up-list-joi';


module.exports = {


  friendlyName: 'ref:get-ref-up-list-joi',


  description: 'ref:get-ref-up-list-joi',


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
      accountGuid: Joi
        .string()
        .description('account guid to get ref-up list for')
        .guid()
        .required(),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      const refUpRecsRaw = await sails.helpers.storage.refUpGetJoi({
        criteria: {
          account_guid: input.accountGuid,
        }
      });

      if (refUpRecsRaw.status !== 'ok') {
        throw new Error(`${moduleName}, error: RefUp find error:
        account_guid: ${input.accountGuid}
        refUpRecsRaw: ${JSON.stringify(refUpRecsRaw, null, 3)}`);
      }

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: refUpRecsRaw.payload,
      })

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {
            error: e,
          },
        }
      };

    }

  }

};


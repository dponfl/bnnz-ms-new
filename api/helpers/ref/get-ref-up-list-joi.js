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

    let accountGuid;


    try {

      input = await schema.validateAsync(inputs.params);

      accountGuid = input.accountGuid;


      const refUpRecsRaw = await sails.helpers.storage.refUpGetJoi({
        criteria: {
          account_guid: input.accountGuid,
        }
      });

      if (refUpRecsRaw.status !== 'ok') {
        // throw new Error(`${moduleName}, error: RefUp find error:
        // account_guid: ${input.accountGuid}
        // refUpRecsRaw: ${JSON.stringify(refUpRecsRaw, null, 3)}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'RefUp find error',
          accountGuid,
          errorName: sails.config.custom.REF_ERROR.name,
          payload: {
            refUpRecsRaw,
          },
        });

      }

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: refUpRecsRaw.payload,
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


'use strict';

const Joi = require('@hapi/joi');

const moduleName = 'api:helpers:security:check-signature';


module.exports = {


  friendlyName: 'api:helpers:security:check-signature',


  description: 'api:helpers:security:check-signature',


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
      signature: Joi
        .string()
        .description('hash')
        .required(),
      data: Joi
        .object()
        .description('data to build hash')
        .required(),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      const signature = input.signature;
      const data = input.data;

      const calculatedHash = await sails.helpers.security.calculateHash({data});

      return exits.success(signature.toLowerCase() === calculatedHash.toLowerCase());

    } catch (e) {
      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError,
        });
        return exits.success(false);
      }
    }

  }

};



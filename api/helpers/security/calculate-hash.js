'use strict';

const Joi = require('@hapi/joi');
const crypto = require('crypto');

const moduleName = 'api:helpers:security:calculate-hash';


module.exports = {


  friendlyName: 'api:helpers:security:calculate-hash',


  description: 'api:helpers:security:calculate-hash',


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
      data: Joi
        .object()
        .description('data to build hash')
        .required(),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      const data = input.data;

      const values = [];

      values.push(sails.config.custom.enums.interMsRequests.password);

      for (const key in data) {
        values.push(`${key}=${data[key]}`);
      }

      const hash = crypto.createHash(sails.config.custom.enums.interMsRequests.hashingAlgorithm);

      hash.update(values.join(':'));

      const calculatedHash = hash.digest('hex');

      return exits.success(calculatedHash);

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


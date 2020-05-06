"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'storage:ref-up-get-joi';


module.exports = {


  friendlyName: 'storage:ref-up-get-joi',


  description: 'storage:ref-up-get-joi',


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
      criteria: Joi
        .any()
        .description('criteria to get records for')
        .required(),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      const refUpRecs = await RefUp.find({
        where: input.criteria,
      });

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: refUpRecs,
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


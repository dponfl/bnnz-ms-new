"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'storage:ref-up-get-by-criteria-joi';


module.exports = {


  friendlyName: 'storage:ref-up-get-by-criteria-joi',


  description: 'storage:ref-up-get-by-criteria-joi',


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
        .description('search criteria')
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
        payload: refUpRecs, // array of record objects of empty array
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


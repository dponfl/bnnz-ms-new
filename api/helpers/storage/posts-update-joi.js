"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'storage:posts-update-joi';


module.exports = {


  friendlyName: 'storage:posts-update-joi',


  description: 'Posts record update',


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
      criteria: Joi.any().required(),
      data: Joi.any().required(),
    });

    try {

      const input = await schema.validateAsync(inputs.params);

      await Posts.update(input.criteria).set(input.data);

      return exits.success({
        status: 'ok',
        message: 'Posts record updated successfully',
        payload: {
          criteria: input.criteria,
          data: input.data,
        },
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


"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'storage:tasks-update-joi';


module.exports = {


  friendlyName: 'storage:tasks-update-joi',


  description: 'Update tasks record',


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
        .required()
        .description('Criteria to update only one task record'),
      data: Joi
        .any()
        .required()
        .description('Data to update to the task record'),
    });

    try {

      const input = await schema.validateAsync(inputs.params);

      await Tasks.update(input.criteria).set(input.data);

      return exits.success({
        status: 'ok',
        message: 'Task record updated',
        payload: {
          criteria: input.criteria,
          data: input.data
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


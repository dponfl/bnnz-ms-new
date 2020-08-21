"use strict";

const Joi = require('@hapi/joi');
const uuid = require('uuid-apikey');

const moduleName = 'storage:pending-actions-get-joi';


module.exports = {


  friendlyName: 'storage:pending-actions-get-joi',


  description: 'storage:pending-actions-get-joi',


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

    let pendingActionsRecs;

    try {

      input = await schema.validateAsync(inputs.params);

      pendingActionsRecs = await PendingActions.find({
        where: input.criteria,
      });

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: pendingActionsRecs,
      })

    } catch (e) {

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
          errorPayloadAdditional: {
            criteria: input.criteria,
          },
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            criteria: input.criteria,
          },
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


"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'general:load-initial-funnels-all-joi';

module.exports = {


  friendlyName: 'Load all initial funnels for the client category',


  description: 'Load all initial funnels for the client category',


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
      client: Joi
        .any()
        .description('Client record')
        .required(),
      clientCategory: Joi
        .string()
        .description('Client category')
        .required(),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      const funnels = await Funnels.findOne({
        name: input.clientCategory,
        active: true
      });

      input.client.funnels = {};

      for (const funnel in funnels.funnel_data) {
        input.client.funnels[funnel] = funnels.funnel_data[funnel];
      }


      await sails.helpers.storage.clientUpdateJoi({
        criteria: {guid: input.client.guid},
        data: {
          funnels: input.client.funnels,
        },
        createdBy: moduleName,
      });

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {
          client: input.client,
        }
      });


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


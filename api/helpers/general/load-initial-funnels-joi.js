"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'general:load-initial-funnels-joi';

module.exports = {


  friendlyName: 'Load initial funnels',


  description: 'This helper loads initial funnel content to the client\'s profile',


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
      funnelName: Joi
        .string()
        .description('Funnel name to load')
        .required(),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      const funnels = await Funnels.findOne({
        name: input.clientCategory,
        active: true
      })
        .tolerate(async (err) => {

          err.details = {
            name: input.clientCategory,
            active: true
          };

          await LogProcessor.dbError({
            error: err,
            message: 'Funnels.findOne() error',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              name: input.clientCategory,
              active: true
            },
          });

          return null;
        });

      if (funnels == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
          location: moduleName,
          message: 'Funnels.findOne() error',
          // clientGuid,
          // accountGuid,
          errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
          payload: {
            name: input.clientCategory,
            active: true
          },
        });
      }


      input.client.funnels[input.funnelName] = funnels.funnel_data[input.funnelName];

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


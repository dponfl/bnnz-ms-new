"use strict";

module.exports = {


  friendlyName: 'Load initial funnels',


  description: 'This helper loads initial funnel content to the client\'s profile',


  inputs: {
    client: {
      friendlyName: 'client',
      description: 'Client record',
      type: 'ref',
      required: true,
    },
    clientCategory: {
      friendlyName: 'Client category',
      description: 'Client category',
      type: 'string',
      required: true,
    },
    funnelName: {
      friendlyName: 'Funnel name',
      description: 'Funnel name to load',
      type: 'string',
      required: true,
    },
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {

    sails.log.info('general:loadInitialFunnels helper...');
    // sails.log.debug('input params: ', inputs);

    try {

      const funnels = await Funnels.findOne({
        name: inputs.clientCategory,
        active: true
      });

      // sails.log.debug('funnels: ', funnels);

      inputs.client.funnels[inputs.funnelName] = funnels.funnel_data[inputs.funnelName];

      await sails.helpers.storage.clientUpdate.with({
        criteria: {guid: inputs.client.guid},
        data: {
          funnels: inputs.client.funnels,
        }
      });

      return exits.success({
        status: 'ok',
        message: 'Updated client record',
        payload: {
          client: inputs.client,
        }
      });


    } catch (e) {

      const errorLocation = 'api/helpers/general/load-initial-funnels';
      const errorMsg = sails.config.custom.GENERAL_HELPER_ERROR;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
        }
      };

    }

  }

};


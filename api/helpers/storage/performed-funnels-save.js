"use strict";

module.exports = {


  friendlyName: 'Performed funnels saving helper',


  description: 'Save all the performed funnels',


  inputs: {

    client_guid: {
      friendlyName: 'client guid',
      description: 'client guid',
      type: 'string',
      required: true,
    },
    current_funnel: {
      friendlyName: 'current funnel',
      description: 'current funnel',
      type: 'string',
      required: true,
    },

    funnel_data: {
      friendlyName: 'performed funnel data',
      description: 'performed funnel data',
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

    try {

      await PerformedFunnels.create({
        client_guid: inputs.client_guid,
        current_funnel: inputs.current_funnel,
        funnel_data: inputs.funnel_data,
      });

      return exits.success({
        status: 'ok',
        message: 'Performed funnels record created',
        payload: {},
      })

    } catch (e) {

      const errorLocation = 'api/helpers/storage/performed-funnels-save';
      const errorMsg = sails.config.custom.PERFORMEDFUNNELSSAVE_ERROR;

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


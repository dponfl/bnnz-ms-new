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

      throw {err: {
          module: 'api/helpers/storage/performed-funnels-save',
          message: sails.config.custom.PERFORMEDFUNNELSSAVE_ERROR,
          payload: {
            params: inputs,
            error: {
              name: e.name || 'no error name',
              message: _.truncate(e.message, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error message',
              stack: _.truncate(e.stack, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error stack',
              code: e.code || 'no error code',
            }
          }
        }
      };

    }

  }


};


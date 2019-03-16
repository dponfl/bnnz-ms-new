module.exports = {


  friendlyName: 'optin::afterNotProceed',


  description: 'optin::afterNotProceed',


  inputs: {
    client: {
      friendlyName: 'client',
      description: 'Client record',
      type: 'ref',
      required: true,
    },
    block: {
      friendlyName: 'block',
      description: 'Current funnel block',
      type: 'ref',
      required: true,
    },
    msg: {
      friendlyName: 'message',
      description: 'Message received',
      type: 'ref',
      // required: true,
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

    let clientParams = {};
    let getServiceRes;
    let funnels;


    try {

      sails.log.debug('/*************** optin::afterNotProceed ***************/');

      inputs.block.done = true;

      /**
       * Save the current funnel at performed_funnels table
       */

      await sails.helpers.storage.performedFunnelsSave.with({
        client_guid: inputs.client.guid,
        current_funnel: inputs.client.current_funnel,
        funnel_data: inputs.client.funnels,
      });


      /**
       * Update the client record with initial funnel
       * to enable the client to make registration again
       */

      getServiceRes = await Service.findOne({
        id: inputs.client.service.id,
        deleted: false,
      });

      clientParams.current_funnel = getServiceRes.funnel_start;


      funnels = await Funnels.findOne({
        name: getServiceRes.funnel_name,
        active: true
      });


      clientParams.funnels = funnels.funnel_data || null;

      getClientResponse = await sails.helpers.storage.clientUpdate.with({
        criteria: {guid: inputs.client.guid},
        data: clientParams
      });

      inputs.client.current_funnel = getServiceRes.funnel_start;
      inputs.client.funnels = funnels.funnel_data || null;

    } catch (e) {

      throw {err: {
          module: 'api/helpers/funnel/optin/after-not-proceed',
          message: 'api/helpers/funnel/optin/after-not-proceed error',
          payload: {
            params: inputs,
            error: {
              name: e.name || 'no error name',
              message: e.message || 'no error message',
              stack: e.stack || 'no error stack',
              code: e.code || 'no error code',
            }
          }
        }
      };

    }


    return exits.success({
      status: 'ok',
      message: 'Success',
      payload: {}
    });
  }


};


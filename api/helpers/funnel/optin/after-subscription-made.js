module.exports = {


  friendlyName: 'optin::afterSubscriptionMade',


  description: 'optin::afterSubscriptionMade',


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

      sails.log.debug('/*************** optin::afterSubscriptionMade ***************/');

      inputs.block.done = true;
      inputs.block.shown = true;

      if (inputs.client.profile_confirmed
        && inputs.client.payment_made
        && inputs.client.subscription_made
      ) {

        /**
         * The client finalized subscription process
         */

        inputs.client.service_subscription_finalized = true;

      } else {

        /**
         * Throw error because by this moment all
         * profile_confirmed, payment_made and subscription_made
         * must be true
         */

        throw new Error(`Wrong flags (profile_confirmed, payment_made or subscription_made): ${inputs.client}`);

      }


      /**
       * Save the current funnel at performed_funnels table
       */

      await sails.helpers.storage.performedFunnelsSave.with({
        client_guid: inputs.client.guid,
        current_funnel: inputs.client.current_funnel,
        funnel_data: inputs.client.funnels,
      });

      await sails.helpers.funnel.afterHelperGeneric.with({
        client: inputs.client,
        block: inputs.block,
        msg: inputs.msg,
        next: true,
        previous: true,
        switchFunnel: true,
      });

    } catch (e) {

      sails.log.error('api/helpers/funnel/optin/after-subscription-made, error: ', e);

      throw {err: {
          module: 'api/helpers/funnel/optin/after-subscription-made',
          message: 'api/helpers/funnel/optin/after-subscription-made error',
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


module.exports = {


  friendlyName: 'optin::callbackSelectServiceLevel',


  description: 'optin::callbackSelectServiceLevel',


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
    query: {
      friendlyName: 'query',
      description: 'Callback query received',
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

      sails.log.debug('/*************** optin::callbackSelectServiceLevel ***************/');

      // sails.log.debug('Client: ', inputs.client);
      sails.log.debug('Block: ', inputs.block);
      sails.log.debug('Query: ', inputs.query);


      switch (inputs.query.data) {
        case 'sl_platinum':
          inputs.block.next = 'optin::selected_platinum';
          break;
        case 'sl_gold':
          inputs.block.next = 'optin::selected_gold';
          break;
        case 'sl_bronze':
          inputs.block.next = 'optin::selected_bronze';
          break;
        default:
          throw new Error(`Wrong callback data: ${inputs.query.data}`);
      }

      inputs.block.done = true;

      await sails.helpers.funnel.afterHelperGeneric.with({
        client: inputs.client,
        block: inputs.block,
        msg: inputs.query,
        next: true,
        previous: true,
        switchFunnel: true,
      });


    } catch (e) {

      throw {err: {
          module: 'api/helpers/funnel/optin/callback-select-service-level',
          message: 'api/helpers/funnel/optin/callback-select-service-level error',
          payload: {
            client: inputs.client,
            block: inputs.block,
            query: inputs.query,
            error: e.message || 'no error message',
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


module.exports = {


  friendlyName: 'Callback test helper',


  description: 'Callback test helper',


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

      sails.log.debug('/*************** Callback test helper ***************/');

      sails.log.debug('Client: ', inputs.client);
      sails.log.debug('Block: ', inputs.block);
      sails.log.debug('Query: ', inputs.query);

      inputs.block.done = true;

    } catch (e) {

      throw {err: {
          module: 'api/helpers/funnel/optin/callback-test',
          message: 'api/helpers/funnel/optin/callback-test error',
          payload: {
            client: inputs.client,
            block: inputs.block,
            query: inputs.query,
            error: e,
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


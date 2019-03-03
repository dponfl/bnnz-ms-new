module.exports = {


  friendlyName: 'optin::callbackGeneralInfo',


  description: 'optin::callbackGeneralInfo',


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

      sails.log.debug('/*************** optin::callbackGeneralInfo ***************/');

      // sails.log.debug('Client: ', inputs.client);
      sails.log.debug('Block: ', inputs.block);
      sails.log.debug('Query: ', inputs.query);

      // throw {err: {
      //     module: 'api/helpers/funnel/optin/callback-general-info',
      //     message: 'api/helpers/funnel/optin/callback-general-info error',
      //     payload: {
      //       client: inputs.client,
      //       block: inputs.block,
      //       query: inputs.query,
      //       error: 'Test error message from optin::callbackGeneralInfo',
      //     }
      //   }
      // };

      throw new Error('Test error message from optin::callbackGeneralInfo');

      switch (inputs.query.data) {
        case 'general_info_yes':
          inputs.block.next = 'optin::proceed';
          break;
        case 'general_info_no':
          inputs.block.next = 'optin::not_proceed';
          break;
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
          module: 'api/helpers/funnel/optin/callback-general-info',
          message: 'api/helpers/funnel/optin/callback-general-info error',
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


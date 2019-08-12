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

      sails.log.info('/*************** optin::callbackGeneralInfo ***************/');

      // sails.log.debug('Client: ', inputs.client);
      // sails.log.debug('Block: ', inputs.block);
      // sails.log.debug('Query: ', inputs.query);


      switch (inputs.query.data) {
        case 'general_info_yes':
          inputs.block.next = 'optin::proceed';
          break;
        case 'general_info_no':
          inputs.block.next = 'optin::not_proceed';
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
          module: 'api/helpers/funnel/optin/callback-general-info',
          message: 'api/helpers/funnel/optin/callback-general-info error',
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


    return exits.success({
      status: 'ok',
      message: 'Success',
      payload: {}
    });
  }


};


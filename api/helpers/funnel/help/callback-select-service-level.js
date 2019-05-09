module.exports = {


  friendlyName: 'help::callbackSelectServiceLevel',


  description: 'help::callbackSelectServiceLevel',


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

    const newAccount = _.find(inputs.client.accounts, {guid: inputs.client.account_tmp});
    const newAccountInd = _.findIndex(inputs.client.accounts, (o) => {
      return o.guid === newAccount.guid;
    });

    try {

      sails.log.debug('/*************** help::callbackSelectServiceLevel ***************/');

      // sails.log.debug('Client: ', inputs.client);
      sails.log.debug('Block: ', inputs.block);
      sails.log.debug('Query: ', inputs.query);


      switch (inputs.query.data) {
        case 'sl_platinum':
          inputs.block.next = 'help::selected_platinum';
          inputs.client.accounts[newAccountInd].payment_plan = 'platinum';
          inputs.client.accounts[newAccountInd].payment_plan_selected = true;
          break;
        case 'sl_gold':
          inputs.block.next = 'help::selected_gold';
          inputs.client.accounts[newAccountInd].payment_plan = 'gold';
          inputs.client.accounts[newAccountInd].payment_plan_selected = true;
          break;
        case 'sl_bronze':
          inputs.block.next = 'help::selected_bronze';
          inputs.client.accounts[newAccountInd].payment_plan = 'bronze';
          inputs.client.accounts[newAccountInd].payment_plan_selected = true;
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
          module: 'api/helpers/funnel/help/callback-select-service-level',
          message: 'api/helpers/funnel/help/callback-select-service-level error',
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


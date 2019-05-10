module.exports = {


  friendlyName: 'help::afterSubscriptionCheck',


  description: 'help::afterSubscriptionCheck',


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


    let updateBlock;
    let getBlock;
    let splitRes;
    let updateFunnel;
    let updateId;

    try {

      sails.log.debug('/*************** help::afterSubscriptionCheck ***************/');

      /**
       * Get value of 'previous' of help::start block
       */

      updateBlock = 'help::start';

      splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
      updateFunnel = splitRes[0];
      updateId = splitRes[1];

      getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});


      inputs.block.next = getBlock.previous;

      /**
       * Update block specified at 'next' key
       */

      updateBlock = inputs.block.next;

      splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
      updateFunnel = splitRes[0];
      updateId = splitRes[1];


      getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

      if (getBlock) {

        getBlock.enabled = true;
        getBlock.done = false;
        getBlock.next = null;
        getBlock.switchToFunnel = null;
        inputs.block.switchToFunnel = updateFunnel;

      } else {

        throw new Error(`Wrong block decoding for data: ${updateBlock}`);

      }

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
       * Update Help funnel to the initial state to enable the client to perform it again
       */

      await sails.helpers.general.loadInitialFunnels.with({
        client: inputs.client,
        clientCategory: currentAccount.service.funnel_name,
        funnelName: 'help',
      });

      await sails.helpers.funnel.afterHelperGeneric.with({
        client: inputs.client,
        block: inputs.block,
        msg: inputs.query,
        next: true,
        previous: false,
        switchFunnel: true,
      });


    } catch (e) {

      throw {err: {
          module: 'api/helpers/funnel/help/after-subscription-check',
          message: 'api/helpers/funnel/help/after-subscription-check error',
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


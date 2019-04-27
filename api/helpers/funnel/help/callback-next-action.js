module.exports = {


  friendlyName: 'help::callbackNextAction',


  description: 'help::callbackNextAction',


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

    let updateBlock;
    let getBlock;
    let splitRes;
    let updateFunnel;
    let updateId;

    let initialBlockPreviousData;

    try {

      const currentAccount = _.find(inputs.client.accounts, {guid: inputs.client.account_use});

      sails.log.debug('/*************** help::callbackNextAction ***************/');

      // sails.log.debug('Client: ', inputs.client);
      sails.log.debug('Block: ', inputs.block);
      sails.log.debug('Query: ', inputs.query);


      switch (inputs.query.data) {
        case 'help_start':

          /**
           * Get and save info about the previous block of help::start block
           * to update help::start block after help funnel updated to initial stage
           */

          updateBlock = 'help::start';

          splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
          updateFunnel = splitRes[0];
          updateId = splitRes[1];


          getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

          if (getBlock) {

            initialBlockPreviousData = getBlock.previous;

          } else {

            throw new Error(`Wrong block decoding for data: ${updateBlock}`);

          }

          inputs.block.done = true;

          const initialHelpFunnelRes = await sails.helpers.general.loadInitialFunnels.with({
            client: inputs.client,
            clientCategory: currentAccount.service.funnel_name,
            funnelName: 'help',
          });

          if (initialHelpFunnelRes.status !== 'ok') {

            throw new Error(`Wrong loadInitialFunnels result: ${initialHelpFunnelRes}`);

          }

          inputs.client.funnels = initialHelpFunnelRes.payload.client.funnels;

          /**
           * Save info about previous block
           */

          updateBlock = 'help::start';

          splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
          updateFunnel = splitRes[0];
          updateId = splitRes[1];


          getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

          if (getBlock) {

            getBlock.previous = initialBlockPreviousData;

          } else {

            throw new Error(`Wrong block decoding for data: ${updateBlock}`);

          }

          getBlock.previous = initialBlockPreviousData;


          inputs.block.next = 'help::start';

          await sails.helpers.funnel.afterHelperGeneric.with({
            client: inputs.client,
            block: inputs.block,
            msg: inputs.query,
            next: true,
            previous: false,
            switchFunnel: true,
          });

          break;
        case 'help_return':

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

          break;
        default:
          throw new Error(`Wrong callback data: ${inputs.query.data}`);
      }

    } catch (e) {

      throw {err: {
          module: 'api/helpers/funnel/help/callback-next-action',
          message: 'api/helpers/funnel/help/callback-next-action error',
          payload: {
            params: inputs,
            error: {
              name: e.name || 'no error name',
              message: _.truncate(e.message, {length: 320}) || 'no error message',
              stack: _.truncate(e.stack, {length: 320}) || 'no error stack',
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


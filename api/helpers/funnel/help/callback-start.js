module.exports = {


  friendlyName: 'help::callbackStart',


  description: 'help::callbackStart',


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

    try {

      const currentAccount = _.find(inputs.client.accounts, {guid: inputs.client.account_use});

      sails.log.info('/*************** help::callbackStart ***************/');

      // sails.log.debug('Client: ', inputs.client);
      // sails.log.debug('Block: ', inputs.block);
      // sails.log.debug('Query: ', inputs.query);


      switch (inputs.query.data) {
        case 'help_send_post':

          inputs.block.next = 'help::send_post';

          /**
           * Update help::send_post block
           */

          updateBlock = 'help::send_post';

          splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
          updateFunnel = splitRes[0];
          updateId = splitRes[1];


          getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

          if (getBlock) {

            getBlock.previous = 'help::start';

          } else {

            throw new Error(`Wrong block decoding for data: ${updateBlock}`);

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

          break;

        case 'help_add_account':

          inputs.block.next = 'help::add_account_start';

          inputs.block.done = true;

          await sails.helpers.funnel.afterHelperGeneric.with({
            client: inputs.client,
            block: inputs.block,
            msg: inputs.query,
            next: true,
            previous: true,
            switchFunnel: true,
          });

          break;

        case 'help_return':

          inputs.block.next = inputs.block.previous;

          /**
           * Update block specified at 'previous' key
           */

          updateBlock = inputs.block.previous;

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

      const errorLocation = 'api/helpers/funnel/help/callback-start';
      const errorMsg = 'Error';

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
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


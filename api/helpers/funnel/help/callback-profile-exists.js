module.exports = {


  friendlyName: 'help::callbackProfileExists',


  description: 'help::callbackProfileExists',


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

      sails.log.info('/*************** help::callbackProfileExists ***************/');

      // sails.log.debug('Client: ', inputs.client);
      // sails.log.debug('Block: ', inputs.block);
      // sails.log.debug('Query: ', inputs.query);


      switch (inputs.query.data) {

        case 'help_profile_exists_add_account_yes':

          /**
           * Update help::get_login block
           */

          updateBlock = 'help::get_login';

          splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
          updateFunnel = splitRes[0];
          updateId = splitRes[1];


          getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

          if (getBlock) {

            getBlock.shown = false;
            getBlock.done = false;
            getBlock.next = null;

          } else {

            throw new Error(`Wrong block decoding for data: ${updateBlock}`);

          }

          inputs.block.next = 'help::get_login';
          inputs.block.done = false;
          inputs.block.shown = false;
          inputs.block.enabled = false;

          break;

        case 'help_profile_exists_add_account_no':

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

          break;

        default:
          throw new Error(`Wrong callback data: ${inputs.query.data}`);
      }

      await sails.helpers.funnel.afterHelperGeneric.with({
        client: inputs.client,
        block: inputs.block,
        msg: inputs.query,
        next: true,
        previous: false,
        switchFunnel: true,
      });


    } catch (e) {

      const errorLocation = 'api/helpers/funnel/help/callback-profile-exists';
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


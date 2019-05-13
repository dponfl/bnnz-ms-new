module.exports = {


  friendlyName: 'general::callbackSelectAccount',


  description: 'general::callbackSelectAccount',


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

    const currentAccount = _.find(inputs.client.accounts, {guid: inputs.client.account_use});


    try {

      sails.log.debug('/*************** general::callbackSelectAccount ***************/');

      // sails.log.debug('Client: ', inputs.client);
      sails.log.debug('Block: ', inputs.block);
      sails.log.debug('Query: ', inputs.query);


      sails.log.warn('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      sails.log.warn('Account selected: ', inputs.query.data);
      sails.log.warn('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');

      const accGuid = _.split(inputs.query.data, 'acc_');
      sails.log.warn('addGuid: ', accGuid);

      inputs.block.done = true;

      const initialHelpFunnelRes = await sails.helpers.general.loadInitialFunnels.with({
        client: inputs.client,
        clientCategory: currentAccount.service.funnel_name,
        funnelName: 'general',
      });

      if (initialHelpFunnelRes.status !== 'ok') {

        throw new Error(`Wrong loadInitialFunnels result: ${initialHelpFunnelRes}`);

      }

      inputs.client.funnels = initialHelpFunnelRes.payload.client.funnels;

      /**
       * Update general::start block
       */

      updateBlock = 'general::start';

      splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
      updateFunnel = splitRes[0];
      updateId = splitRes[1];


      getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

      if (getBlock) {

        getBlock.enabled = true;

      } else {

        throw new Error(`Wrong block decoding for data: ${updateBlock}`);

      }

      inputs.client.account_use = accGuid[1];

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
          module: 'api/helpers/funnel/general/callback-select-account',
          message: 'api/helpers/funnel/general/callback-select-account error',
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


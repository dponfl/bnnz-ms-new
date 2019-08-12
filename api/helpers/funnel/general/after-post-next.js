module.exports = {

  friendlyName: 'general::afterPostNext',

  description: 'general::afterPostNext',

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
    },
  },

  exits: {

    success: {
      description: 'All done.',
    },

  },

  fn: async function (inputs,exits) {

    try {

      sails.log.info('/*************** general::afterPostNext ***************/');

      const currentAccount = _.find(inputs.client.accounts, {guid: inputs.client.account_use});
      const currentAccountInd = _.findIndex(inputs.client.accounts, (o) => {
        return o.guid === currentAccount.guid;
      });

      inputs.block.done = true;

      /**
       * Update General funnel to the initial state to enable the client to perform it again
       */

      await sails.helpers.general.loadInitialFunnels.with({
        client: inputs.client,
        clientCategory: inputs.client.accounts[currentAccountInd]['service']['funnel_name'],
        funnelName: 'general',
      });

      await sails.helpers.funnel.afterHelperGeneric.with({
        client: inputs.client,
        block: inputs.block,
        msg: inputs.msg,
        next: true,
        previous: false,
        switchFunnel: true,
      });
    } catch (e) {

      throw {err: {
          module: 'api/helpers/funnel/general/after-post-next',
          message: 'api/helpers/funnel/general/after-post-next error',
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


module.exports = {


  friendlyName: 'confirmSubscription',


  description: 'confirmSubscription',


  inputs: {
    cid: {
      friendlyName: 'client guid',
      description: 'client guid',
      type: 'string',
      required: true,
    },
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {
    sails.log.debug('************** confirmSubscription helper **************');

    let client;
    let account;
    let accountInd;
    let updateBlock;
    let getBlock;
    let splitRes;
    let updateFunnel;
    let updateId;

    try {

      client = await Client.findOne({
        guid: inputs.cid,
      });

      if (!client) {

        /**
         * Reply that the client was not found
         */

        sails.log('client was NOT FOUND');

        return exits.success({
          status: 'not_found',
          message: sails.config.custom.CONFIRM_SUBSCRIPTION_CLIENT_NOT_FOUND,
          payload: {
            cid: inputs.cid,
          },
        });

      }

      /**
       * found record for the specified criteria
       */

      sails.log('client was FOUND');

      const accountRecordsRaw = await sails.helpers.storage.accountGet.with({
        clientId: client.id,
      });

      const accountRecords = accountRecordsRaw.payload;

      if (accountRecords.length === 0) {

        /**
         * Record(s) for the client's account(s) not found
         */

        sails.log.error('api/helpers/general/confirm-subscription.js, Error: account(s) NOT FOUND, client: ', client);

        return exits.success({
          status: 'not_found',
          message: sails.config.custom.ACCOUNT_NOT_FOUND,
          payload: {
            client: client,
          },
        });

      }

      /**
       * found accountRecords for the specified criteria
       */

      sails.log.debug('api/helpers/general/confirm-subsciption.js, accout(s) FOUND: ', accountRecords);

      client = _.assignIn(client, {accounts: accountRecords});

      account = _.find(accountRecords, {guid: client.account_use});
      accountInd = _.findIndex(accountRecords, (o) => {
        return o.guid === account.guid;
      });

      if (typeof account === 'undefined') {

        sails.log.error('api/helpers/general/confirm-subsciption, error: Cannot find account by client.account_use');
        throw new Error('api/helpers/general/confirm-subsciption, error: Cannot find account by client.account_use');

      }

      if (account.subscription_made) {
        return exits.success({
          status: 'subscription_was_done',
          message: sails.config.custom.CONFIRM_SUBSCRIPTION_SUBSCRIPTION_WAS_MADE,
          payload: {
            cid: inputs.cid,
          },
        });
      }

      account.subscription_made = true;
      accountRecords[accountInd] = account;
      client.accounts = accountRecords;


      /**
       * Update optin::wait_subscription_check block
       */

      updateBlock = 'optin::wait_subscription_check';

      splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
      updateFunnel = splitRes[0];
      updateId = splitRes[1];


      getBlock = _.find(client.funnels[updateFunnel], {id: updateId});

      if (getBlock) {
        getBlock.done = true;
        getBlock.next = 'optin::subscription_check_done';
      }


      /**
       * Update optin::subscription_check_done block
       */

      updateBlock = 'optin::subscription_check_done';

      splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
      updateFunnel = splitRes[0];
      updateId = splitRes[1];


      getBlock = _.find(client.funnels[updateFunnel], {id: updateId});

      if (getBlock) {
        getBlock.enabled = true;
      }

      await sails.helpers.storage.clientUpdate.with({
        criteria: {guid: client.guid},
        data: client,
      });


      /**
       * Try to find the initial block of the current funnel
       */

      let initialBlock = _.find(client.funnels[client.current_funnel],
        {initial: true});

      /**
       * Check that the initial block was found
       */

      if (!_.isNil(initialBlock) && !_.isNil(initialBlock.id)) {

        await sails.helpers.funnel.proceedNextBlock.with({
          client: client,
          funnelName: client.current_funnel,
          blockId: initialBlock.id,
        });

      }

      return exits.success({
        status: 'success',
        message: sails.config.custom.CONFIRM_SUBSCRIPTION_SUCCESS,
        payload: {
          client_guid: client.guid,
        }
      });


    } catch (e) {

      sails.log.error('api/helpers/general/confirm-subscription error, input: ', inputs);
      sails.log.error('api/helpers/general/confirm-subscription error, error: ', e);

      throw {err: {
          module: 'api/helpers/general/confirm-subscription',
          message: sails.config.custom.CONFIRM_SUBSCRIPTION_GENERAL_ERROR,
          payload: {
            params: inputs,
            error: {
              name: e.name || 'no error name',
              message: _.truncate(e.message, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error message',
              stack: _.truncate(e.stack, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error stack',
              code: e.code || 'no error code',
            }
          },
        }
      };

    }


  }

};


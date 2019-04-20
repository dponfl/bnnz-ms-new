module.exports = {


  friendlyName: 'confirmPayment',


  description: 'confirmPayment',


  inputs: {
    cid: {
      friendlyName: 'client guid',
      description: 'client guid',
      type: 'string',
      required: true,
    },
    sl: {
      friendlyName: 'service level',
      description: 'service level',
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
    sails.log.debug('************** confirmPayment helper **************');

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
          message: sails.config.custom.CONFIRM_PAYMENT_CLIENT_NOT_FOUND,
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

        sails.log.error('api/helpers/general/confirm-payment.js, Error: account(s) NOT FOUND, client: ', client);

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

      sails.log.debug('api/helpers/general/confirm-payment.js, accout(s) FOUND: ', accountRecords);

      client = _.assignIn(client, {accounts: accountRecords});

      account = _.find(accountRecords, {guid: client.account_use});
      accountInd = _.findIndex(accountRecords, (o) => {
        return o.guid === account.guid;
      });

      if (typeof account === 'undefined') {

        sails.log.error('api/helpers/general/confirm-payment, error: Cannot find account by client.account_use');
        throw new Error('api/helpers/general/confirm-payment, error: Cannot find account by client.account_use');

      }

      /**
       * Check received service level corresponds to the one selected by the client
       */

      if (inputs.sl !== account.payment_plan) {

        return exits.success({
          status: 'wrong_sl',
          message: sails.config.custom.CONFIRM_PAYMENT_WRONG_SL,
          payload: {
            cid: inputs.cid,
            account_sl: account.payment_plan,
            inputs_sl: inputs.sl,
          },
        });

      }

      if (account.payment_made) {

        return exits.success({
          status: 'payment_was_done',
          message: sails.config.custom.CONFIRM_PAYMENT_PAYMENT_WAS_MADE,
          payload: {
            cid: inputs.cid,
            account_sl: account.payment_plan,
            inputs_sl: inputs.sl,
          },
        });

      }

      switch (account.payment_plan) {
        case 'platinum':

          /**
           * Update optin::selected_platinum block
           */

          updateBlock = 'optin::selected_platinum';

          splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
          updateFunnel = splitRes[0];
          updateId = splitRes[1];


          getBlock = _.find(client.funnels[updateFunnel], {id: updateId});

          if (getBlock) {
            getBlock.done = true;
            getBlock.next = 'optin::platinum_paid';
          }


          /**
           * Update optin::platinum_paid block
           */

          updateBlock = 'optin::platinum_paid';

          splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
          updateFunnel = splitRes[0];
          updateId = splitRes[1];


          getBlock = _.find(client.funnels[updateFunnel], {id: updateId});

          if (getBlock) {
            getBlock.enabled = true;
          }

          /**
           * Generate rooms and link client to them
           */

          await linkRoomsToClient(account);

          break;

        case 'gold':

          /**
           * Update optin::selected_gold block
           */

          updateBlock = 'optin::selected_gold';

          splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
          updateFunnel = splitRes[0];
          updateId = splitRes[1];


          getBlock = _.find(client.funnels[updateFunnel], {id: updateId});

          if (getBlock) {
            getBlock.done = true;
            getBlock.next = 'optin::gold_paid';
          }


          /**
           * Update optin::gold_paid block
           */

          updateBlock = 'optin::gold_paid';

          splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
          updateFunnel = splitRes[0];
          updateId = splitRes[1];


          getBlock = _.find(client.funnels[updateFunnel], {id: updateId});

          if (getBlock) {
            getBlock.enabled = true;
          }

          /**
           * Generate rooms and link client to them
           */

          await linkRoomsToClient(account);

          break;

        case 'bronze':

          /**
           * Update optin::selected_bronze block
           */

          updateBlock = 'optin::selected_bronze';

          splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
          updateFunnel = splitRes[0];
          updateId = splitRes[1];


          getBlock = _.find(client.funnels[updateFunnel], {id: updateId});

          if (getBlock) {
            getBlock.done = true;
            getBlock.next = 'optin::bronze_paid';
          }


          /**
           * Update optin::bronze_paid block
           */

          updateBlock = 'optin::bronze_paid';

          splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
          updateFunnel = splitRes[0];
          updateId = splitRes[1];


          getBlock = _.find(client.funnels[updateFunnel], {id: updateId});

          if (getBlock) {
            getBlock.enabled = true;
          }

          /**
           * Generate rooms and link client to them
           */

          await linkRoomsToClient(account);

          break;

        default:
          throw new Error(`Wrong payment plan: ${account.payment_plan}`);
      }

      account.payment_made = true;
      accountRecords[accountInd] = account;
      client.tos_accepted = true;
      client.accounts = accountRecords;

      /**
       * Try to find the initial block of the current funnel
       */

      let initialBlock = _.find(client.funnels[client.current_funnel],
        {initial: true});

      // sails.log.debug('initialBlock: ', initialBlock);

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
        message: sails.config.custom.CONFIRM_PAYMENT_SUCCESS,
        payload: {
          client_guid: client.guid,
        }
      });

    } catch (e) {

      sails.log.error('api/helpers/general/confirm-payment error, input: ', inputs);
      sails.log.error('api/helpers/general/confirm-payment error, error: ', e);

      throw {err: {
          module: 'api/helpers/general/confirm-payment',
          message: sails.config.custom.CONFIRM_PAYMENT_GENERAL_ERROR,
          payload: {
            params: inputs,
            error: {
              name: e.name || 'no error name',
              message: e.message || 'no error message',
              stack: e.stack || 'no error stack',
              code: e.code || 'no error code',
            }
          },
        }
      };
    }
  }
};

async function linkRoomsToClient(accountRec) {

  _.forEach(accountRec.room, async function (elem) {
      let room = await Room.findOne({id: elem.id});

      if (room) {
        await Account.removeFromCollection(accountRec.id, 'room', room.id);
        await Room.updateOne({id: room.id})
          .set({clients_number: room.clients_number - 1})
      }
  });

  const rooms = await sails.helpers.general.getRoom(accountRec.service.rooms);

  await Account.addToCollection(accountRec.id, 'room', rooms.payload.roomIDsRes);


}


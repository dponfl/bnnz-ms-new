"use strict";

const moment = require('moment');

const moduleName = 'general:confirm-payment';

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
    aid: {
      friendlyName: 'account guid',
      description: 'account guid',
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
    sails.log.info('************** confirmPayment helper **************');

    let client;
    let account;
    let accountInd;
    let updateBlock;
    let getBlock;
    let splitRes;
    let updateFunnel;
    let updateId;
    let getServiceRes;

    let clientGuid;
    let accountGuid;

    try {

      client = await Client.findOne({
        guid: inputs.cid,
      })
        .tolerate(async (err) => {

          err.details = {
            guid: inputs.cid,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'Client.findOne() error',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              guid: inputs.cid,
            },
          });

          return null;
        });

      if (client == null) {

        /**
         * Reply that the client was not found
         */

        // sails.log('client was NOT FOUND');

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

      // sails.log('client was FOUND');

      const accountRecordsRaw = await sails.helpers.storage.accountGetJoi({
        clientId: client.id,
      });

      const accountRecords = accountRecordsRaw.payload;

      if (accountRecords.length === 0) {

        /**
         * Record(s) for the client's account(s) not found
         */

        // sails.log.error('api/helpers/general/confirm-payment.js, Error: account(s) NOT FOUND, client: ', client);

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

      // sails.log.debug('api/helpers/general/confirm-payment.js, accout(s) FOUND: ', accountRecords);

      client = _.assignIn(client, {accounts: accountRecords});

      account = _.find(accountRecords, {guid: inputs.aid});

      clientGuid = client.guid;
      accountGuid = account.guid;

      if (_.isNil(account)) {

        // sails.log.error('api/helpers/general/confirm-payment, error: Cannot find account by inputs.aid=' + inputs.aid);
        //
        // throw {err: {
        //     module: 'api/helpers/general/confirm-payment',
        //     message: 'Cannot find account by inputs.aid=' + inputs.aid,
        //     payload: {},
        //   }
        // };

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Cannot find account by inputs.aid',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            inputs,
          },
        });
      }

      accountInd = _.findIndex(accountRecords, (o) => {
        return o.guid === account.guid;
      });


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
           * Update service for the account in accordance to the selected one
           */

          getServiceRes = await sails.helpers.storage.getService.with({serviceName: account.payment_plan});
          account.service = getServiceRes.payload;

          /**
           * Update selected_platinum block for the current funnel
           */

          updateBlock = client.current_funnel + '::selected_platinum';

          splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
          updateFunnel = splitRes[0];
          updateId = splitRes[1];


          getBlock = _.find(client.funnels[updateFunnel], {id: updateId});

          if (getBlock) {
            getBlock.done = true;
            getBlock.next = client.current_funnel + '::platinum_paid';
          }


          /**
           * Update platinum_paid block for the current funnel
           */

          updateBlock = client.current_funnel + '::platinum_paid';

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

          await sails.helpers.general.reallocateRoomsToAccount(account);

          break;

        case 'gold':

          /**
           * Update service for the account in accordance to the selected one
           */

          getServiceRes = await sails.helpers.storage.getService.with({serviceName: account.payment_plan});
          account.service = getServiceRes.payload;

          /**
           * Update selected_gold block for the current funnel
           */

          updateBlock = client.current_funnel + '::selected_gold';

          splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
          updateFunnel = splitRes[0];
          updateId = splitRes[1];


          getBlock = _.find(client.funnels[updateFunnel], {id: updateId});

          if (getBlock) {
            getBlock.done = true;
            getBlock.next = client.current_funnel + '::gold_paid';
          }


          /**
           * Update gold_paid block for the current funnel
           */

          updateBlock = client.current_funnel + '::gold_paid';

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

          await sails.helpers.general.reallocateRoomsToAccount(account);

          break;

        case 'bronze':

          /**
           * Update service for the account in accordance to the selected one
           */

          getServiceRes = await sails.helpers.storage.getService.with({serviceName: account.payment_plan});
          account.service = getServiceRes.payload;

          /**
           * Update selected_bronze block for the current funnel
           */

          updateBlock = client.current_funnel + '::selected_bronze';

          splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
          updateFunnel = splitRes[0];
          updateId = splitRes[1];


          getBlock = _.find(client.funnels[updateFunnel], {id: updateId});

          if (getBlock) {
            getBlock.done = true;
            getBlock.next = client.current_funnel + '::bronze_paid';
          }


          /**
           * Update bronze_paid block for the current funnel
           */

          updateBlock = client.current_funnel + '::bronze_paid';

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

          await sails.helpers.general.reallocateRoomsToAccount(account);

          break;

        default:
          // throw new Error(`Wrong payment plan: ${account.payment_plan}`);
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Wrong payment plan',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.GENERAL_ERROR.name,
            payload: {
              payment_plan: account.payment_plan,
            },
          });
      }

      account.payment_made = true;

      /**
       * Обновляем информацию об оплаченом периоде
       * (исходим из того, что оплата поступает за 1 месяц)
       */

      if (account.subscription_until != null) {
        account.subscription_from = moment(account.subscription_until).add(1,'d').format();
        account.subscription_until = moment(account.subscription_from).add(1,'M').format();
      } else {
        account.subscription_from = moment().format();
        account.subscription_until = moment(account.subscription_from).add(1,'M').format();
      }

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

      // Сохраняем обновлённую информацию для client & account (clientUpdate)

      const clientUpdateRes = await sails.helpers.storage.clientUpdate.with({
        criteria: {guid: client.guid},
        data: client,
      });

      if (clientUpdateRes.status != null && clientUpdateRes.status !== 'ok') {
        // throw new Error('Wrong clientUpdate response: ' + JSON.stringify(clientUpdateRes));
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'Wrong clientUpdate response',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            clientUpdateRes,
          },
        });
      }

      return exits.success({
        status: 'success',
        message: sails.config.custom.CONFIRM_PAYMENT_SUCCESS,
        payload: {
          client_guid: client.guid,
          account_guid: account.guid,
        }
      });

    } catch (e) {

      // const errorLocation = 'api/helpers/general/confirm-payment';
      // const errorMsg = sails.config.custom.CONFIRM_PAYMENT_GENERAL_ERROR;
      //
      // sails.log.error(errorLocation + ', error: ' + errorMsg);
      // sails.log.error(errorLocation + ', error details: ', e);
      //
      // throw {err: {
      //     module: errorLocation,
      //     message: errorMsg,
      //     payload: {},
      //   }
      // };

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
          },
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
          },
        });
        return exits.success({
          status: 'error',
          message: `${moduleName} performed`,
          payload: {},
        });
      }

    }
  }
};



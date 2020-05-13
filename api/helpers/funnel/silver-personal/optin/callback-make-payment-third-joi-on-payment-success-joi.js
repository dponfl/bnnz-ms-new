"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment');

const moduleName = 'funnel:silver-personal:optin:callback-make-payment-third-on-payment-success-joi';


module.exports = {


  friendlyName: 'funnel:silver-personal:optin:callback-make-payment-third-on-payment-success-joi',


  description: 'funnel:silver-personal:optin:callback-make-payment-third-on-payment-success-joi',


  inputs: {

    params: {
      friendlyName: 'input params',
      description: 'input params',
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

    const schema = Joi.object({
      client: Joi
        .any()
        .description('client record')
        .required(),
      block: Joi
        .any()
        .description('funnel block initiated the payment process')
        .required(),
      paymentGroup: Joi
        .any()
        .description('paymentGroup record')
        .required(),
    });

    let input;
    let splitRes;
    let updateFunnel;
    let updateId;
    let getBlock;

    try {

      input = await schema.validateAsync(inputs.params);

      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});
      const currentAccountInd = _.findIndex(input.client.accounts, (o) => {
        return o.guid === currentAccount.guid;
      });

      /**
       * Обновляем поля записи текущего аккаунта
       */

      const priceConfig = sails.config.custom.config.price;

      input.client.accounts[currentAccountInd].payment_made = true;
      input.client.accounts[currentAccountInd].subscription_from = moment()
        .format();
      input.client.accounts[currentAccountInd].subscription_until = moment()
        .add(priceConfig.payment_periods.period_01.value, priceConfig.payment_periods.period_01.period)
        .format();

      const reallocateRoomsToAccountJoiParams = {
        account: currentAccount,
      };

      const reallocateRoomsToAccountJoiRaw = await sails.helpers.general.reallocateRoomsToAccountJoi(reallocateRoomsToAccountJoiParams);

      if (reallocateRoomsToAccountJoiRaw.status !== 'ok') {
        throw new Error(`${moduleName}, error: wrong reallocateRoomsToAccountJoi response:
        reallocateRoomsToAccountJoiParams: ${JSON.stringify(reallocateRoomsToAccountJoiParams, null, 3)}
        reallocateRoomsToAccountJoiRaw: ${JSON.stringify(reallocateRoomsToAccountJoiRaw, null, 3)}`);
      }


      // await sails.helpers.storage.accountUpdateJoi({
      //   criteria: {
      //     guid: input.client.account_use,
      //   },
      //   data: {
      //     payment_made: true,
      //     subscription_from: moment()
      //       .format(),
      //     subscription_until: moment()
      //       .add(priceConfig.payment_periods.period_01.value, priceConfig.payment_periods.period_01.period)
      //       .format(),
      //   },
      //   createdBy: moduleName,
      // });

      /**
       * Устанавливаем значение для следующего блока в 'optin::payment_successful'
       */

      input.block.next = 'optin::payment_successful';

      /**
       * Устанавливае у следующего блока значение для предшествующего блока в 'optin::more_info_03'
       */

      splitRes = _.split(input.block.next, sails.config.custom.JUNCTION, 2);
      updateFunnel = splitRes[0];
      updateId = splitRes[1];


      getBlock = _.find(input.client.funnels[updateFunnel], {id: updateId});

      if (getBlock) {
        getBlock.previous = 'optin::more_info_03';
        getBlock.enabled = true;
      }

      await sails.helpers.storage.clientUpdateJoi({
        criteria: {guid: input.client.guid},
        data: {funnels: input.client.funnels},
        createdBy: moduleName,
      });

      /**
       * Try to find the initial block of the current funnel
       */

      let initialBlock = _.find(input.client.funnels[input.client.current_funnel],
        {initial: true});

      /**
       * Check that the initial block was found
       */

      if (!_.isNil(initialBlock) && !_.isNil(initialBlock.id)) {

        await sails.helpers.funnel.proceedNextBlockJoi({
          client: input.client,
          funnelName: input.client.current_funnel,
          blockId: initialBlock.id,
          createdBy: moduleName,
        });

      } else {

        /**
         * Throw error -> initial block was not found
         */

        throw new Error(`${moduleName}, error: initial block was not found`);
      }


      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      })

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {
            error: e,
          },
        }
      };

    }

  }

};


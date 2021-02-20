"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment');

const moduleName = 'funnel:friend:optin:after-join-ref-prepare-list-joi';


module.exports = {


  friendlyName: 'funnel:friend:optin:after-join-ref-prepare-list-joi',


  description: 'funnel:friend:optin:after-join-ref-prepare-list-joi',


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
        .description('Client record')
        .required(),
      block: Joi
        .any()
        .description('Current funnel block')
        .required(),
      msg: Joi
        .any()
        .description('Message received'),
    });

    let input;

    let clientGuid;
    let accountGuid;

    let useLang;

    let priceConfigText;
    let priceConfigGeneral;

    let currentAccount;
    let currentAccountInd;
    let currentRegion;

    let currentAmount;
    let currentCurrency;
    let currentCurrencyText;
    let currentServiceName;


    let updateBlock;
    let getBlock;
    let splitRes;
    let updateFunnel;
    let updateId;

    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      /**
       * Сохраняем информацию и выполненном "платеже" (чтобы не возникло перекоса из-за незаполненных полей)
       */

      currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});
      currentRegion = currentAccount.region;
      currentServiceName = currentAccount.service.name;

      currentAccountInd = _.findIndex(input.client.accounts, (o) => {
        return o.guid === currentAccount.guid;
      });

      useLang = (_.has(sails.config.custom.config.lang, input.client.lang) ? input.client.lang : 'ru');

      priceConfigText = sails.config.custom.config.lang[useLang].price;
      priceConfigGeneral = sails.config.custom.config.price;

      if (priceConfigText == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'No text price config found (missing config.lang[useLang].price)',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR.name,
          payload: {
            useLang,
          },
        });
      }

      if (priceConfigGeneral == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'No text price config found (missing config.price)',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR.name,
          payload: {},
        });
      }

      currentAmount = priceConfigGeneral[currentRegion][currentServiceName].period_01.current_price;
      currentCurrency = priceConfigGeneral[currentRegion].currency;
      // currentCurrencyText = priceConfigText.currency[currentCurrency];

      /**
       * Обновляем поля записи текущего аккаунта
       */

      input.client.accounts[currentAccountInd].payment_made = true;
      input.client.accounts[currentAccountInd].subscription_from = moment()
        .format();
      input.client.accounts[currentAccountInd].subscription_until = moment()
        .add(priceConfigGeneral.payment_periods.period_01.value, priceConfigGeneral.payment_periods.period_01.period)
        .format();

      input.client.accounts[currentAccountInd].payment_amount = currentAmount;
      input.client.accounts[currentAccountInd].payment_currency = currentCurrency;


      /**
       * Прописываем клиента в комнаты
       */


      const reallocateRoomsToAccountJoiParams = {
        account: currentAccount,
      };

      const reallocateRoomsToAccountJoiRaw = await sails.helpers.general.reallocateRoomsToAccountJoi(reallocateRoomsToAccountJoiParams);

      if (reallocateRoomsToAccountJoiRaw.status !== 'ok') {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Wrong reallocateRoomsToAccountJoi response',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR.name,
          payload: {
            reallocateRoomsToAccountJoiParams,
            reallocateRoomsToAccountJoiRaw,
          },
        });
      }


      /**
       * Update next block
       */

      updateBlock = input.block.next;

      splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
      updateFunnel = splitRes[0];
      updateId = splitRes[1];

      if (_.isNil(updateFunnel)
        || _.isNil(updateId)
      ) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'Block parsing error',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR.name,
          payload: {
            updateBlock,
            block: input.block,
          },
        });
      }

      getBlock = _.find(input.client.funnels[updateFunnel], {id: updateId});

      if (getBlock) {
        getBlock.shown = false;
        getBlock.done = false;
        getBlock.next = null;
      } else {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'Block not found',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR.name,
          payload: {
            updateId,
            updateFunnel,
            funnel: input.client.funnels[updateFunnel],
          },
        });
      }

      input.block.done = true;

      await sails.helpers.funnel.afterHelperGenericJoi({
        client: input.client,
        block: input.block,
        msg: input.msg,
        next: true,
        previous: true,
        switchFunnel: true,
        createdBy: moduleName,
      });

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      })

    } catch (e) {
      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
        });
        return exits.success({
          status: 'ok',
          message: `${moduleName} performed`,
          payload: {},
        });
      }
    }

  }

};


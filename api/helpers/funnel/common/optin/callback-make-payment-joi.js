"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment');


const moduleName = 'funnel:common:optin:callback-make-payment-joi';


module.exports = {


  friendlyName: 'funnel:common:optin:callback-make-payment-joi',


  description: 'funnel:common:optin:callback-make-payment-joi',


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
      query: Joi
        .any()
        .description('Callback query received')
        .required(),
    });

    let input;

    let clientGuid;
    let accountGuid;

    let useLang;

    let priceConfigText;
    let priceConfigGeneral;

    let currentAccount;
    let currentRegion;

    let currentAmount;
    let currentCurrency;
    let currentCurrencyText;
    let currentServiceName;

    const usePaymentSystem = sails.config.custom.usePaymentSystem;


    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});
      currentRegion = currentAccount.region;
      currentServiceName = currentAccount.service.name;

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
      currentCurrencyText = priceConfigText.currency[currentCurrency];


      switch (input.query.data) {
        case 'more_info':

          input.block.next = 'optin::more_info_01';

          break;
        default:
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Wrong callback data',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.FUNNELS_ERROR.name,
            payload: {
              inputQueryData: input.query.data,
            },
          });

      }

      input.block.done = true;

      await sails.helpers.funnel.afterHelperGenericJoi({
        client: input.client,
        block: input.block,
        msg: input.query,
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
          clientGuid,
          accountGuid,
          error: e,
          location: moduleName,
          throwError,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          clientGuid,
          accountGuid,
          error: e,
          location: moduleName,
          throwError,
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


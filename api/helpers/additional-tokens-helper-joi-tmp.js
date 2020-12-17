"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'module:helper';


module.exports = {


  friendlyName: 'module:helper',


  description: 'module:helper',


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
    });

    let input;

    let clientGuid;
    let accountGuid;

    let additionalTokens = [];

    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});
      const currentRegion = currentAccount.region;
      const currentServiceName = currentAccount.service.name;

      const defaultLang = sails.config.custom.config.general.defaultLang.toLowerCase();
      const useLang = (_.has(sails.config.custom.config.lang, input.client.lang) ? input.client.lang : defaultLang);

      const priceConfigText = sails.config.custom.config.lang[useLang].price;
      const priceConfigGeneral = sails.config.custom.config.price;

      const currentAmount = priceConfigGeneral[currentRegion][currentServiceName].period_01.current_price;
      const listAmount = priceConfigGeneral[currentRegion][currentServiceName].period_01.list_price;
      const currentCurrency = priceConfigGeneral[currentRegion].currency;
      const currentCurrencyText = priceConfigText.currency[currentCurrency];

      const token01 = {
        token: '$somePriceToken01$',
        value: `${currentAmount} ${currentCurrencyText}`,
      };

      additionalTokens.push(token01);

      const token02 = {
        token: '$somePriceToke2$',
        value: `${listAmount} ${currentCurrencyText}`,
      };

      additionalTokens.push(token02);

      return exits.success({
        status: 'success',
        message: `${moduleName} performed`,
        payload: additionalTokens,
      })

    } catch (e) {

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
          }
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
          }
        });
        return exits.success({
          status: 'success',
          message: `${moduleName} WAS NOT performed`,
          payload: [],
        });
      }

    }

  }

};


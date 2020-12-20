"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'push-messages:push-to-paid:personal:additional-tokens-call-to-action-two';


module.exports = {


  friendlyName: 'push-messages:push-to-paid:personal:additional-tokens-call-to-action-two',


  description: 'push-messages:push-to-paid:personal:additional-tokens-call-to-action-two',


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

      const currentCurrency = priceConfigGeneral[currentRegion].currency;
      const currentCurrencyText = priceConfigText.currency[currentCurrency];

      const beLikeListPrice = priceConfigGeneral[currentRegion]['bronze_personal'].period_01.list_price;
      const beLikePushToPaidPrice = priceConfigGeneral[currentRegion]['bronze_personal'].period_01.pushToPaidPrice;
      const beLikePushToPaidDiscount = beLikeListPrice - beLikePushToPaidPrice;

      const beHeroListPrice = priceConfigGeneral[currentRegion]['silver_personal'].period_01.list_price;
      const beHeroPushToPaidPrice = priceConfigGeneral[currentRegion]['silver_personal'].period_01.pushToPaidPrice;
      const beHeroPushToPaidDiscount = beHeroListPrice - beHeroPushToPaidPrice;

      const beStarListPrice = priceConfigGeneral[currentRegion]['gold_personal'].period_01.list_price;
      const beStarPushToPaidPrice = priceConfigGeneral[currentRegion]['gold_personal'].period_01.pushToPaidPrice;
      const beStarPushToPaidDiscount = beStarListPrice - beStarPushToPaidPrice;

      const beLegendListPrice = priceConfigGeneral[currentRegion]['platinum_personal'].period_01.list_price;
      const beLegendPushToPaidPrice = priceConfigGeneral[currentRegion]['platinum_personal'].period_01.pushToPaidPrice;
      const beLegendPushToPaidDiscount = beLegendListPrice - beLegendPushToPaidPrice;


      additionalTokens.push({
        token: '$BeLikeListPrice$',
        value: `${beLikeListPrice} ${currentCurrencyText}`,
      });

      additionalTokens.push({
        token: '$BeLikePushToPaidPrice$',
        value: `${beLikePushToPaidPrice} ${currentCurrencyText}`,
      });

      additionalTokens.push({
        token: '$BeLikePushToPaidDiscount$',
        value: `${beLikePushToPaidDiscount} ${currentCurrencyText}`,
      });


      additionalTokens.push({
        token: '$BeHeroListPrice$',
        value: `${beHeroListPrice} ${currentCurrencyText}`,
      });

      additionalTokens.push({
        token: '$BeHeroPushToPaidPrice$',
        value: `${beHeroPushToPaidPrice} ${currentCurrencyText}`,
      });

      additionalTokens.push({
        token: '$BeHeroPushToPaidDiscount$',
        value: `${beHeroPushToPaidDiscount} ${currentCurrencyText}`,
      });


      additionalTokens.push({
        token: '$BeStarListPrice$',
        value: `${beStarListPrice} ${currentCurrencyText}`,
      });

      additionalTokens.push({
        token: '$BeStarPushToPaidPrice$',
        value: `${beStarPushToPaidPrice} ${currentCurrencyText}`,
      });

      additionalTokens.push({
        token: '$BeStarPushToPaidDiscount$',
        value: `${beStarPushToPaidDiscount} ${currentCurrencyText}`,
      });


      additionalTokens.push({
        token: '$BeLegendListPrice$',
        value: `${beLegendListPrice} ${currentCurrencyText}`,
      });

      additionalTokens.push({
        token: '$BeLegendPushToPaidPrice$',
        value: `${beLegendPushToPaidPrice} ${currentCurrencyText}`,
      });

      additionalTokens.push({
        token: '$BeLegendPushToPaidDiscount$',
        value: `${beLegendPushToPaidDiscount} ${currentCurrencyText}`,
      });


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


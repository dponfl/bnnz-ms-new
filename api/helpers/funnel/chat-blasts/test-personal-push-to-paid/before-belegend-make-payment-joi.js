"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:chat-blasts:test-personal-push-to-paid:before-belegend-make-payment-joi';


module.exports = {


  friendlyName: 'funnel:chat-blasts:test-personal-push-to-paid:before-belegend-make-payment-joi',


  description: 'funnel:chat-blasts:test-personal-push-to-paid:before-belegend-make-payment-joi',


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
      payload: Joi
        .any()
        .description('{text, inline_keyboard, img, video, doc} object')
        .required(),
      msg: Joi
        .any()
        .description('Message received'),
    });

    let input;

    let clientGuid;
    let accountGuid;

    let client;

    const currentServiceName = sails.config.custom.enums.serviceNames.platinumPersonal;

    try {

      input = await schema.validateAsync(inputs.params);

      client = input.client;

      clientGuid = client.guid;
      accountGuid = client.account_use;

      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});
      const currentRegion = currentAccount.region;

      const defaultLang = sails.config.custom.config.general.defaultLang.toLowerCase();
      const useLang = (_.has(sails.config.custom.config.lang, input.client.lang) ? input.client.lang : defaultLang);

      const priceConfigText = sails.config.custom.config.lang[useLang].price;
      const priceConfigGeneral = sails.config.custom.config.price;

      const currentCurrency = priceConfigGeneral[currentRegion].currency;
      const currentCurrencyText = priceConfigText.currency[currentCurrency];

      const listPrice = priceConfigGeneral[currentRegion][currentServiceName].period_01.list_price;
      const pushToPaidPrice = priceConfigGeneral[currentRegion][currentServiceName].period_01.pushToPaidPrice;
      const pushToPaidDiscount = listPrice - pushToPaidPrice;


      const resHtml = await MessageProcessor.parseSpecialTokens({
        client,
        message: input.payload.text,
        additionalTokens: [
          {
            token: '$ListPrice$',
            value: `${listPrice} ${currentCurrencyText}`,
          },
          {
            token: '$PushToPaidPrice$',
            value: `${pushToPaidPrice} ${currentCurrencyText}`,
          },
          {
            token: '$PushToPaidDiscount$',
            value: `${pushToPaidDiscount} ${currentCurrencyText}`,
          },
        ],
      });

      return exits.success({
        text: resHtml,
        inline_keyboard: input.payload.inline_keyboard,
      });

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
          status: 'ok',
          message: `${moduleName} performed`,
          payload: {},
        });
      }

    }

  }

};


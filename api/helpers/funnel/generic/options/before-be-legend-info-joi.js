"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:generic:options:before-be-legend-info-joi';


module.exports = {


  friendlyName: 'funnel:generic:options:before-be-legend-info-joi',


  description: 'funnel:generic:options:before-be-legend-info-joi',


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


    try {

      input = await schema.validateAsync(inputs.params);

      client = input.client;

      clientGuid = client.guid;
      accountGuid = client.account_use;

      const currentRegion = sails.config.custom.config.general.defaultRegion;
      const defaultLang = sails.config.custom.config.general.defaultLang.toLowerCase();
      const useLang = (_.has(sails.config.custom.config.lang, client.lang) ? client.lang : defaultLang);

      const currentServiceName = 'platinum_personal';
      const priceConfigGeneral = sails.config.custom.config.price;
      const priceConfigText = sails.config.custom.config.lang[useLang].price;


      const currentAmount = priceConfigGeneral[currentRegion][currentServiceName].period_01.current_price;
      const listAmount = priceConfigGeneral[currentRegion][currentServiceName].period_01.list_price;
      const currentCurrency = priceConfigGeneral[currentRegion].currency;
      const currentCurrencyText = priceConfigText.currency[currentCurrency];


      const resHtml = await MessageProcessor.parseSpecialTokens({
        client,
        message: input.payload.text,
        additionalTokens: [
          {
            token: '$BeLikePriceCurrent$',
            value: `${currentAmount} ${currentCurrencyText}`,
          },
          {
            token: '$BeLikePriceList$',
            value: `${listAmount} ${currentCurrencyText}`,
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


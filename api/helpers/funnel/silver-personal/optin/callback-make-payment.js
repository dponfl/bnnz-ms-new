"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:silver-personal:optin:callback-make-payment';


module.exports = {


  friendlyName: 'funnel:silver-personal:optin:callback-make-payment',


  description: 'funnel:silver-personal:optin:callback-make-payment',


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

    try {

      input = await schema.validateAsync(inputs.params);

      switch (input.query.data) {
        case 'make_payment':

          /**
           * Инициировать последовательность действий по оплате
           */

          const paymentProvider = sails.config.custom.config.payments[input.client.messenger]['provider'].toLowerCase();

          if (paymentProvider == null) {
            throw new Error(`${moduleName}, error: No payment provider config for messenger: ${input.client.messenger}`);
          }

          const useLang = (_.has(sails.config.custom.config.lang, input.client.lang) ? input.client.lang : 'ru');

          const priceConfigText = sails.config.custom.config.lang[useLang].price;
          const priceConfigGeneral = sails.config.custom.config.price;

          if (priceConfigText == null) {
            throw new Error(`${moduleName}, error: No text price config found: ${JSON.stringify(sails.config.custom.config.lang[useLang].price, null, 3)}`);
          }

          if (priceConfigGeneral == null) {
            throw new Error(`${moduleName}, error: No general price config found: ${JSON.stringify(sails.config.custom.config.price, null, 3)}`);
          }

          const title = MessageProcessor.parseStr({
            client: input.client,
            token: "BEHERO_MAKE_PAYMENT_PMT_TITLE",
            additionalTokens: [
              {
                token: "$paymentPeriod$",
                value: priceConfigText.payment_periods.period_01,
              }
            ]
          });

          const description = MessageProcessor.parseStr({
            client: input.client,
            token: "BEHERO_MAKE_PAYMENT_PMT_DESCRIPTION",
            additionalTokens: [
              {
                token: "$paymentPeriod$",
                value: priceConfigText.payment_periods.period_01,
              }
            ]
          });

          const currency = 'RUB';

          const item01Description = MessageProcessor.parseStr({
          client: input.client,
          token: "BEHERO_MAKE_PAYMENT_PMT_ITEM1_DESCRIPTION",
            additionalTokens: [
              {
                token: "$paymentPeriod$",
                value: priceConfigText.payment_periods.period_01,
              }
            ]
          });

          const item02Description = MessageProcessor.parseStr({
          client: input.client,
          token: "BEHERO_MAKE_PAYMENT_PMT_ITEM2_DESCRIPTION",
          });


          const invoiceItems = [
            {
              description: item01Description,
              quantity: '1.0',
              price: priceConfigGeneral[currency].silver_personal.period_01.list_price,
              currency,
              transform_to_min_price_unit: priceConfigGeneral[currency].transform_to_min_price_unit,
            },
            {
              description: item02Description,
              quantity: '1.0',
              price: priceConfigGeneral[currency].silver_personal.period_01.current_price - priceConfigGeneral[currency].silver_personal.period_01.list_price,
              currency,
              transform_to_min_price_unit: priceConfigGeneral[currency].transform_to_min_price_unit,
            },
          ];

          const sendInvoiceResultRaw = await sails.helpers.pgw[paymentProvider]['sendInvoiceJoi']({
            client: input.client,
            title,
            description,
            startParameter: 'start',
            currency,
            invoiceItems,
          });

          if (sendInvoiceResultRaw.status !== 'ok') {
            throw new Error(`${moduleName}, error: sendInvoice error response:
            ${JSON.stringify(sendInvoiceResultRaw, null, 3)}`);
          }

          const accountIndex = _.findIndex(input.client.accounts, {guid: input.client.account_use});

          if (accountIndex < 0) {
            throw new Error(`${moduleName}, error: account not found:
            client.account_use: ${input.client.account_use}
            client.accounts: ${JSON.stringify(input.client.accounts, null, 3)}`);
          }

          input.client.accounts[accountIndex].payment_amount = priceConfigGeneral[currency].silver_personal.period_01.current_price;
          input.client.accounts[accountIndex].payment_currency = currency;



          // input.block.next = 'optin::make_payment';
          break;
        case 'more_info':
          // input.block.next = 'optin::try_again';
          break;
        case 'get_terms':
          // input.block.next = 'optin::try_again';
          break;
        default:
          throw new Error(`${moduleName}, error: Wrong callback data: ${input.query.data}`);
      }

      input.block.done = true;

      await sails.helpers.funnel.afterHelperGenericJoi({
        client: input.client,
        block: input.block,
        msg: input.query,
        next: true,
        previous: true,
        switchFunnel: true,
      });






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


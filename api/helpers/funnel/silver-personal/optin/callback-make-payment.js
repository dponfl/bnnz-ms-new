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

          const priceConfig = sails.config.custom.config.lang[useLang].price.silver_personal;

          if (priceConfig == null) {
            throw new Error(`${moduleName}, error: No price config found: ${JSON.stringify(sails.config.custom.config.lang[useLang].price.silver_personal, null, 3)}`);
          }


          const title = MessageProcessor.parseStr({
            client: input.client,
            token: "BEHERO_MAKE_PAYMENT_PMT_TITLE",
          });

          const description = MessageProcessor.parseStr({
            client: input.client,
            token: "BEHERO_MAKE_PAYMENT_PMT_DESCRIPTION",
            additionalTokens: [
              {
                token: "$paymentPeriod$",
                value: priceConfig.period_01.period_text,
              }
            ]
          });

          const currency = 'RUB';

          const paymentResultRaw = await sails.helpers.pgw[paymentProvider]['sendInvoice'].with({
            messenger: input.client.messenger,
            chatId: input.client.chat_id,
            title,
            description,
            startParameter: 'start',
            currency,
            prices: [
              {
                label: description,
                amount: _.toString(priceConfig.period_01[currency].current_price.value),
              }
            ],
            clientId: input.client.id,
            clientGuid: input.client.guid,
            accountGuid: input.client.account_use,
          });

          // TODO: Добавить в табл accounts поля: payment_amount и payment_currency
          // Записать в эти поля соответствующие данные
          // Позже при успешном платеже сравнивать данные полученные в ответе с этимы данными

          await sails.helpers.storage.accountUpdateJoi({
            criteria: {guid: input.client.account_use},
            data: {
              payment_amount: priceConfig.period_01[currency].current_price.value_cents,
              payment_currency: currency,
            }
          });


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


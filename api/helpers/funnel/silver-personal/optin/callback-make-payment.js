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

          const title = MessageProcessor.parseStr({
            client: input.client,
            token: "BEHERO_MAKE_PAYMENT_PMT_TITLE",
          });

          const paymentResultRaw = await sails.helpers.pgw[paymentProvider]['sendInvoice'].with({
            messenger: input.client.messenger,
            chatId: input.client.chat_id,
            title,
            description: 'Подписка на сервис SocialGrowth "Супер-дупер пакет" на 1 месяц',
            startParameter: 'start',
            currency: 'RUB',
            prices: [
              {
                label: '"Супер-дупер пакет" на 1 месяц',
                amount: '100.77',
              }
            ],
            clientId: input.client.id,
            clientGuid: input.client.guid,
            accountGuid: input.client.account_use,
          });

          const paymentResult = paymentResultRaw;




          input.client.accounts[currentAccountInd].profile_confirmed = true;
          input.block.next = 'optin::make_payment';
          break;
        case 'more_info':
          input.block.next = 'optin::try_again';
          break;
        case 'get_terms':
          input.block.next = 'optin::try_again';
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





      throw new Error(`${moduleName}, error: xxxxxxxxx: \n${JSON.stringify(input.client, null, 3)}`);

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


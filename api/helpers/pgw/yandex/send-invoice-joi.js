"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'pgw:yandex:send-invoice-joi';


module.exports = {

  friendlyName: 'sendInvoice',


  description: 'sendInvoice',


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

  fn: async function(inputs, exits) {

    const schema = Joi.object({
      clientId: Joi
        .number()
        .integer()
        .positive()
        .description('client record id')
        .required(),
      clientGuid: Joi
        .string()
        .description('client record guid')
        .guid()
        .required(),
      accountGuid: Joi
        .string()
        .description('account record guid')
        .guid()
        .required(),
      currency: Joi
        .string()
        .description('Three-letter ISO 4217 currency code (https://core.telegram.org/bots/payments#supported-currencies)')
        .max(3)
        .required(),
      prices: Joi
        .any()
        .description('Breakdown of prices: Array of LabeledPrice (https://core.telegram.org/bots/api#labeledprice)')
        .required(),
      messenger: Joi
        .string()
        .description('messenger name')
        .max(50)
        .valid(sails.config.custom.enums.messenger.TELEGRAM)
        .required(),
      chatId: Joi
        .string()
        .description('client chat id we use to send message')
        .required(),
      title: Joi
        .string()
        .description('Product name: 1-32 characters')
        .max(32)
        .required(),
      description: Joi
        .string()
        .description('Product description: 1-255 characters')
        .max(255)
        .required(),
      startParameter: Joi
        .string()
        .description('Deep-linking parameter')
        .required(),
    });

    let input;


    try {

      input = await schema.validateAsync(inputs.params);

      const paymentProvider = sails.config.custom.config.payments[input.messenger]['provider'].toUpperCase() +
        '_' + sails.config.custom.config.payments[input.messenger]['env'].toUpperCase();

      const itemInvoicePrice = input.prices[0].amount.toString();

      const options = {
        need_name: false,
        need_phone_number: false,
        need_email: true,
        send_phone_number_to_provider: false,
        send_email_to_provider: true,
        provider_data: {
          receipt: {
            items: [
              {
                description: input.description,
                quantity: '1.00',
                amount: {
                  value: itemInvoicePrice,
                  currency: input.currency,
                },
                vat_code: 1,
              },
            ],
          },
        },
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `Оплатить: ${itemInvoicePrice} руб.`,
                pay: true,
              }
            ]
          ]
        }
      };

      const prices = [
        {
          label: input.prices[0].label,
          amount: input.prices[0].amount*100,
        }
      ];

      /**
       * Создать запись в таблице PaymentGroups
       */

      const paymentGroupRecRaw = await sails.helpers.storage.paymentGroupCreateJoi({
        clientId: input.clientId,

      });

      if (paymentGroupRecRaw.status !== 'ok') {
        throw new Error(`${moduleName}, error: payment group record create error:
        ${JSON.stringify(paymentGroupRecRaw, null, 3)}`);
      }

      const sendInvoiceRaw = await sails.helpers.mgw[input.messenger]['sendInvoice'].with({
        chatId: input.chatId,
        title: input.title,
        description: input.description,
        startParameter: input.startParameter,
        currency: input.currency,
        prices,
        options,
        clientId: input.clientId,
        clientGuid: input.clientGuid,
        accountGuid: input.accountGuid,
      });

      return exits.success({
        status: 'ok',
        message: 'Successful Yandex sendInvoice',
        payload: sendInvoiceRaw.payload,
      });

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

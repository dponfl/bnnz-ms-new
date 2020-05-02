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
      client: Joi
        .any()
        .description('client record')
        .required(),
      currency: Joi
        .string()
        .description('Three-letter ISO 4217 currency code (https://core.telegram.org/bots/payments#supported-currencies)')
        .max(3)
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
      invoiceItems: Joi
        .any()
        .description('invoice items')
        .required(),
      startParameter: Joi
        .string()
        .description('Deep-linking parameter')
        .required(),
      funnelBlockName: Joi
        .string()
        .description('funnel block name')
        .required(),
    });

    let input;


    try {

      input = await schema.validateAsync(inputs.params);

      const messenger = input.client.messenger;
      const chatId = input.client.chat_id;
      const clientId = input.client.id;
      const clientGuid = input.client.guid;
      const accountGuid = input.client.account_use;

      const paymentProvider = sails.config.custom.config.payments[messenger]['provider'].toUpperCase() +
        '_' + sails.config.custom.config.payments[messenger]['env'].toUpperCase();

      const items = [];
      const prices = [];
      let invoiceAmount = 0;

      for (const elem of input.invoiceItems) {

        const item = {
          description: elem.description,
          quantity: elem.quantity,
          amount: {
            value: elem.price,
            currency: elem.currency,
          },
          vat_code: 1,
        };

        const price = {
          label: elem.description,
          amount: elem.price * elem.transform_to_min_price_unit,
        };

        invoiceAmount = invoiceAmount + elem.price * elem.quantity;

        items.push(item);
        prices.push(price);

      }

      const itemInvoicePrice = invoiceAmount.toString();

      const inlineKeyboardText = MessageProcessor.parseStr({
        client: input.client,
        token: "BEHERO_MAKE_PAYMENT_INVOICE_BTN",
        additionalTokens: [
          {
            token: "$itemInvoicePrice$",
            value: itemInvoicePrice,
          }
        ]
      });

      const options = {
        need_name: false,
        need_phone_number: false,
        need_email: true,
        send_phone_number_to_provider: false,
        send_email_to_provider: true,
        provider_data: {
          receipt: {
            items,
          },
        },
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: inlineKeyboardText,
                pay: true,
              }
            ]
          ]
        }
      };

      /**
       * Создать запись в таблице PaymentGroups
       */

      const paymentGroupRecRaw = await sails.helpers.storage.paymentGroupCreateJoi({
        clientId,
        clientGuid,
        accountGuid,
        amount: invoiceAmount,
        currency: input.currency,
        type: sails.config.custom.enums.paymentGroupType.DEPOSIT,
        status: sails.config.custom.enums.paymentGroupStatus.PROCESSING,
        paymentProvider,
        messenger,
        funnelBlockName: input.funnelBlockName,
      });

      if (paymentGroupRecRaw.status !== 'ok') {
        throw new Error(`${moduleName}, error: payment group record create error:
        ${JSON.stringify(paymentGroupRecRaw, null, 3)}`);
      }

      const sendInvoiceRaw = await sails.helpers.mgw[messenger]['sendInvoiceJoi']({
        chatId,
        title: input.title,
        description: input.description,
        startParameter: input.startParameter,
        currency: input.currency,
        prices,
        options,
        invoiceAmount,
        clientId,
        clientGuid,
        accountGuid,
        paymentGroupGuid: paymentGroupRecRaw.payload.guid,
      });

      if (sendInvoiceRaw.status !== 'ok') {
        throw new Error(`${moduleName}, error: messenger sendInvoiceJoi error response:
        ${JSON.stringify(sendInvoiceRaw, null, 3)}`);
      }

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

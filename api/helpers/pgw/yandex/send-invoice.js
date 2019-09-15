"use strict";

module.exports = {

  friendlyName: 'sendInvoice',


  description: 'sendInvoice',


  inputs: {

    messenger: {
      friendlyName: 'messenger',
      description: 'Messenger name',
      type: 'string',
      required: true,
    },

    chatId: {
      friendlyName: 'chatId',
      description: 'client chat id we use to send message',
      type: 'string',
      required: true,
    },

    title: {
      friendlyName: 'title',
      description: 'Product name', // 1-32 characters
      type: 'string',
      required: true,
    },

    description: {
      friendlyName: 'description',
      description: 'Product description', // 1-255 characters
      type: 'string',
      required: true,
    },

    startParameter: {
      friendlyName: 'startParameter',
      description: 'Deep-linking parameter',
      type: 'string',
      required: true,
    },

    currency: {
      friendlyName: 'currency',
      description: 'Three-letter ISO 4217 currency code',
      type: 'string', // Three-letter ISO 4217 currency code (https://core.telegram.org/bots/payments#supported-currencies)
      required: true,
    },

    prices: {
      friendlyName: 'prices',
      description: 'Breakdown of prices',
      type: 'ref', // Array of LabeledPrice (https://core.telegram.org/bots/api#labeledprice)
      required: true,
    },

    clientId: {
      friendlyName: 'client_id',
      description: 'Link to the Client record',
      type: 'string',
      required: true,
    },

    clientGuid: {
      friendlyName: 'client_guid',
      description: 'Link to the Client record',
      type: 'string',
      required: true,
    },

  },

  exits: {

    success: {
      description: 'All done.',
    },

  },

  fn: async function(inputs, exits) {

    // sails.log.info('************************* Yandex sendInvoice: ', inputs);

    try {

      const paymentProvider = sails.config.custom.config.payments[inputs.messenger]['provider'].toUpperCase() +
        '_' + sails.config.custom.config.payments[inputs.messenger]['env'].toUpperCase();

      const itemInvoicePrice = inputs.prices[0].amount.toString();

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
                description: inputs.description,
                quantity: '1.00',
                amount: {
                  value: itemInvoicePrice,
                  currency: inputs.currency,
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
          label: inputs.prices[0].label,
          amount: inputs.prices[0].amount*100,
        }
      ];

      const sendInvoiceRaw = await sails.helpers.mgw[inputs.messenger]['sendInvoice'].with({
        chatId: inputs.chatId,
        title: inputs.title,
        description: inputs.description,
        startParameter: inputs.startParameter,
        currency: inputs.currency,
        prices: prices,
        options: options,
        clientId: inputs.clientId,
        clientGuid: inputs.clientGuid
      });

      // sails.log.info(`sendInvoiceRaw: ${sendInvoiceRaw}`);
      // sails.log.info(`sendInvoiceRaw.payload: ${sendInvoiceRaw.payload}`);

      return exits.success({
        status: 'ok',
        message: 'Successful Yandex sendInvoice',
        payload: sendInvoiceRaw.payload,
      });

    } catch (e) {

      const errorLocation = 'api/helpers/pgw/yandex/send-invoice';
      const errorMsg = "Unknown error";

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
        }
      };

    }

  }

};

"use strict";

const uuid = require('uuid-apikey');

module.exports = {


  friendlyName: 'sendInvoice',


  description: 'sendInvoice',


  inputs: {

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

    options: {
      friendlyName: 'options',
      description: 'Additional Telegram query options',
      type: 'ref',
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

  fn: async function (inputs, exits) {

    sails.log.info('Telegram sendInvoice: ', inputs);

    try {

      const paymentProviderTokenResponseRaw = await sails.helpers.general.getPaymentToken('telegram');

      if (paymentProviderTokenResponseRaw.status === 'ok'
      ) {

        const paymentProviderToken = paymentProviderTokenResponseRaw.payload.paymentProviderToken;

        if (paymentProviderToken == null) {
          throw new Error('Error: Cannot get payment provider token');
        }

        const paymentUuid = uuid.create();

        const sendInvoiceResult = await sails.config.custom.telegramBot.sendInvoice(
          inputs.chatId,
          inputs.title,
          inputs.description,
          paymentUuid.uuid,
          paymentProviderToken,
          inputs.startParameter,
          inputs.currency,
          inputs.prices,
          inputs.options || {},
        );

        const paymentProvider = sails.config.custom.config.payments.telegram.provider.toUpperCase() +
          '_' + sails.config.custom.config.payments.telegram.env.toUpperCase();

        await sails.helpers.storage.paymentCreate.with({
          paymentStatus: sails.config.custom.enums.paymentStatus.INVOICE,
          paymentData: {
            title: inputs.title,
            description: inputs.description,
            startParameter: inputs.startParameter,
            currency: inputs.currency,
            prices: inputs.prices,
            options: inputs.options || {},
          },
          paymentResponse: sendInvoiceResult,
          paymentProvider: paymentProvider,
          messenger: sails.config.custom.enums.messenger.TELEGRAM,
          clientId: inputs.clientId,
          clientGuid: inputs.clientGuid
        });


        return exits.success({
          status: 'ok',
          message: 'Test success',
          payload: sendInvoiceResult,
        })

      }

    } catch (e) {

      const errorLocation = 'api/helpers/mgw/telegram/pgw/send-invoice';
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


"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'mgw:telegram:send-invoice-joi';

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

  },

  fn: async function (inputs, exits) {

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
      paymentGroupGuid: Joi
        .string()
        .description('payment group guid')
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
      invoiceAmount: Joi
        .number()
        .description('total invoice amount')
        .required(),
      options: Joi
        .any()
        .description('Additional Telegram query options'),
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

    let clientGuid;
    let accountGuid;

    let sendInvoiceParams;
    let sendInvoiceResult;


    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.clientGuid;
      accountGuid = input.accountGuid;


      const paymentProviderTokenResponseRaw = await sails.helpers.general.getPaymentToken('telegram');

      if (paymentProviderTokenResponseRaw.status === 'ok') {

        const paymentProviderToken = paymentProviderTokenResponseRaw.payload.paymentProviderToken;

        if (paymentProviderToken == null) {

          await sails.helpers.storage.paymentCreateJoi({
            paymentGroupGuid: input.paymentGroupGuid,
            paymentStatus: sails.config.custom.enums.paymentStatus.INVOICE_ERROR,
            paymentData: {
              title: input.title,
              description: input.description,
              startParameter: input.startParameter,
              currency: input.currency,
              prices: input.prices,
              options: input.options || {},
            },
            amount: input.invoiceAmount,
            currency: input.currency,
            paymentResponse: '',
            comments: 'Cannot get payment provider token',
            clientId: input.clientId,
            clientGuid: input.clientGuid,
            accountGuid: input.accountGuid,
          });

          // throw new Error('sendInvoice, Error: Cannot get payment provider token');

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Cannot get payment provider token',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.MGW_TELEGRAM_ERROR.name,
            payload: {
              inputQueryData: input.query.data,
            },
          });

        }

        sendInvoiceParams = {
          chatId: input.chatId,
          title: input.title,
          description: input.description,
          paymentGroupGuid: input.paymentGroupGuid,
          paymentProviderToken,
          startParameter: input.startParameter,
          currency: input.currency,
          prices: input.prices,
          options: input.options,
        };

        sendInvoiceResult = await sails.config.custom.telegramBot.sendInvoice(
          input.chatId,
          input.title,
          input.description,
          input.paymentGroupGuid,
          paymentProviderToken,
          input.startParameter,
          input.currency,
          input.prices,
          input.options || {},
        );


        await sails.helpers.storage.paymentCreateJoi({
          paymentGroupGuid: input.paymentGroupGuid,
          paymentStatus: sails.config.custom.enums.paymentStatus.INVOICE,
          paymentData: {
            title: input.title,
            description: input.description,
            startParameter: input.startParameter,
            currency: input.currency,
            prices: input.prices,
            options: input.options || {},
          },
          paymentResponse: sendInvoiceResult,
          clientId: input.clientId,
          clientGuid: input.clientGuid,
          accountGuid: input.accountGuid,
          amount: input.invoiceAmount,
          currency: input.currency,
        });


        return exits.success({
          status: 'ok',
          message: 'Test success',
          payload: sendInvoiceResult,
        })

      }

    } catch (e) {

      const throwError = false;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
            sendInvoiceParams,
            sendInvoiceResult,
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
            sendInvoiceParams,
            sendInvoiceResult,
          },
        });
        return exits.success({
          status: 'error',
          message: `${moduleName} not performed`,
          payload: {},
        });
      }

    }

  }

};


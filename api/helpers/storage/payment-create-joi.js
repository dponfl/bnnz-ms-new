"use strict";

const Joi = require('@hapi/joi');

const uuid = require('uuid-apikey');

const moduleName = 'storage:payment-create-joi';


module.exports = {


  friendlyName: 'Payment create',


  description: 'Create payment record',


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
      amount: Joi
        .number()
        .integer()
        .positive()
        .description('payment amount')
        .required(),
      currency: Joi
        .string()
        .description('Three-letter ISO 4217 currency code (https://core.telegram.org/bots/payments#supported-currencies)')
        .max(3)
        .required(),
      paymentStatus: Joi
        .string()
        .description('payment status')
        .required(),
      paymentData: Joi
        .any()
        .description('payment data sent')
        .required(),
      paymentResponse: Joi
        .any()
        .description('payment response')
        .required(),
      comments: Joi
        .string()
        .description('payment response'),
    });

    let input;


    try {

      input = await schema.validateAsync(inputs.params);

      const guid = uuid.create().uuid;

      let paymentData = {};
      let paymentResponse = {};
      let paymentId = '';

      if (input.paymentData != null) {
        paymentData = input.paymentData;
      }

      if (input.paymentResponse != null) {
        paymentResponse = input.paymentResponse;
      }

      if (input.paymentData.options != null) {
        paymentData.options.provider_token = '***';
        paymentData.options.provider_data = JSON.parse(paymentData.options.provider_data);
        paymentData.options.reply_markup = JSON.parse(paymentData.options.reply_markup);
        paymentData.options.prices = JSON.parse(paymentData.options.prices);
        paymentId = paymentData.options.payload;
      }

      if (input.paymentResponse.invoice_payload != null) {
        paymentId = input.paymentResponse.invoice_payload;
      }

      // if (input.paymentData != null
      //   && input.paymentData.preCheckoutQuery != null
      //   && input.paymentData.preCheckoutQuery.invoice_payload != null) {
      //   paymentId = input.paymentData.preCheckoutQuery.invoice_payload;
      // }

      if (_.has(input.paymentData, 'preCheckoutQuery.invoice_payload')) {
        paymentId = input.paymentData.preCheckoutQuery.invoice_payload;
      }

      // if (input.paymentData != null
      //   && input.paymentData.successfulPayment != null
      //   && input.paymentData.successfulPayment.invoice_payload != null) {
      //   paymentId = input.paymentData.successfulPayment.invoice_payload;
      // }

      if (_.has(input.paymentData, 'successfulPayment.invoice_payload')) {
        paymentId = input.paymentData.successfulPayment.invoice_payload;
      }

      const paymentRecs = await Payments.find({
        where: {
          paymentGroupGuid: input.paymentGroupGuid,
        }
      })
        .tolerate(async (err) => {

          err.details = {
            where: {
              paymentGroupGuid: input.paymentGroupGuid,
            }
          };

          await LogProcessor.dbError({
            error: err,
            message: 'Payments.find() error',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              where: {
                paymentGroupGuid: input.paymentGroupGuid,
              }
            },
          });

          return [];
        });

      if (_.has(paymentData, 'preCheckoutQuery.from.first_name')) {
        paymentData.preCheckoutQuery.from.first_name = await MessageProcessor.clearStr(paymentData.preCheckoutQuery.from.first_name);
      }

      const paymentRecsNum = paymentRecs.length;

      if (_.has(paymentResponse, 'chat.first_name')) {
        paymentResponse.chat.first_name = await MessageProcessor.clearStr(paymentResponse.chat.first_name);
      }
      if (_.has(paymentResponse, 'chat.last_name')) {
        paymentResponse.chat.last_name = await MessageProcessor.clearStr(paymentResponse.chat.last_name);
      }
      if (_.has(paymentResponse, 'from.first_name')) {
        paymentResponse.from.first_name = await MessageProcessor.clearStr(paymentResponse.from.first_name);
      }
      if (_.has(paymentResponse, 'from.last_name')) {
        paymentResponse.from.last_name = await MessageProcessor.clearStr(paymentResponse.from.last_name);
      }

      await Payments.create({
        guid,
        payment_id: paymentId,
        payment_status: input.paymentStatus,
        paymentGroupGuid: input.paymentGroupGuid,
        order: paymentRecsNum + 1,
        payment_data: paymentData,
        payment_response: paymentResponse,
        comments: input.comments || '',
        client_id: input.clientId,
        client_guid: input.clientGuid,
        account_guid: input.accountGuid,
        amount: input.amount,
        currency: input.currency,
      })
        .tolerate(async (err) => {

          err.details = {
            guid,
            payment_id: paymentId,
            payment_status: input.paymentStatus,
            paymentGroupGuid: input.paymentGroupGuid,
            order: paymentRecsNum + 1,
            payment_data: paymentData,
            payment_response: paymentResponse,
            comments: input.comments || '',
            client_id: input.clientId,
            client_guid: input.clientGuid,
            account_guid: input.accountGuid,
            amount: input.amount,
            currency: input.currency,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'Payments.create() error',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              guid,
              payment_id: paymentId,
              payment_status: input.paymentStatus,
              paymentGroupGuid: input.paymentGroupGuid,
              order: paymentRecsNum + 1,
              payment_data: paymentData,
              payment_response: paymentResponse,
              comments: input.comments || '',
              client_id: input.clientId,
              client_guid: input.clientGuid,
              account_guid: input.accountGuid,
              amount: input.amount,
              currency: input.currency,
            },
          });

          return true;
        });

      return exits.success({
        status: 'ok',
        message: 'Payment record created',
        payload: {},
      })

    } catch (e) {

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
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


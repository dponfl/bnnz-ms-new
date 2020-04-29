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
      let paymentId = '';

      if (input.paymentData.options != null) {

        paymentData = input.paymentData;
        paymentData.options.provider_token = '***';
        paymentData.options.provider_data = JSON.parse(paymentData.options.provider_data);
        paymentData.options.reply_markup = JSON.parse(paymentData.options.reply_markup);
        paymentData.options.prices = JSON.parse(paymentData.options.prices);
        paymentId = paymentData.options.payload;

      }

      if (input.paymentResponse.invoice_payload != null) {

        paymentId = input.paymentResponse.invoice_payload;

      }

      if (input.paymentData.preCheckoutQuery != null) {

        paymentData = input.paymentData;
        paymentId = input.paymentData.preCheckoutQuery.invoice_payload;
      }

      if (input.paymentData.successfulPayment != null) {

        paymentData = input.paymentData;
        paymentId = input.paymentData.successfulPayment.invoice_payload;
      }

      const paymentRecs = await Payments.find({
        where: {
          paymentGroupGuid: input.paymentGroupGuid,
        }
      });

      const paymentRecsNum = paymentRecs.length;

      await Payments.create({
        guid,
        payment_id: paymentId,
        payment_status: input.paymentStatus,
        paymentGroupGuid: input.paymentGroupGuid,
        order: paymentRecsNum + 1,
        payment_data: paymentData,
        payment_response: input.paymentResponse,
        comments: input.comments || '',
        client_id: input.clientId,
        client_guid: input.clientGuid,
        account_guid: input.accountGuid,
        amount: input.amount,
        currency: input.currency,
      });

      return exits.success({
        status: 'ok',
        message: 'Payment record created',
        payload: {},
      })

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}, error: ${sails.config.custom.PAYMENT_CREATE_ERROR}`;

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


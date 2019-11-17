"use strict";

module.exports = {


  friendlyName: 'Payment create',


  description: 'Create initial payment record',


  inputs: {

    paymentStatus: {
      friendlyName: 'Payment status',
      description: 'Payment status',
      type: 'string', // 'invoice', 'pre_checkout', 'successful_payment'
      required: true,
    },

    paymentData: {
      friendlyName: 'Payment data sent',
      description: 'Payment data sent',
      type: 'ref',
      required: true,
    },

    paymentResponse: {
      friendlyName: 'Payment response',
      description: 'Payment response',
      type: 'ref',
      required: true,
    },

    paymentProvider: {
      friendlyName: 'currency',
      description: 'currency',
      type: 'string',
      required: true,
    },

    messenger: {
      friendlyName: 'messenger',
      description: 'messenger',
      type: 'string',
      required: true,
    },

    comments: {
      friendlyName: 'comments',
      description: 'comments',
      type: 'string',
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

    accountGuid: {
      friendlyName: 'account_guid',
      description: 'Link to the Account record',
      type: 'string',
      required: true,
    },

    type: {
      friendlyName: 'payment type',
      description: 'payment type',
      type: 'string',
      required: true,
    },

    amount: {
      friendlyName: 'amount',
      description: 'amount',
      type: 'number',
      required: true,
    },

    currency: {
      friendlyName: 'currency',
      description: 'currency',
      type: 'string',
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

    try {

      let paymentData = {};
      let paymentId = '';

      if (inputs.paymentData.options != null) {

        paymentData = inputs.paymentData;
        paymentData.options.provider_token = '***';
        paymentData.options.provider_data = JSON.parse(paymentData.options.provider_data);
        paymentData.options.reply_markup = JSON.parse(paymentData.options.reply_markup);
        paymentData.options.prices = JSON.parse(paymentData.options.prices);
        paymentId = paymentData.options.payload;

      }

      if (inputs.paymentResponse.invoice_payload != null) {

        paymentId = inputs.paymentResponse.invoice_payload;

      }

      if (inputs.paymentData.preCheckoutQuery != null) {

        paymentData = inputs.paymentData;
        paymentId = inputs.paymentData.preCheckoutQuery.invoice_payload;
      }

      if (inputs.paymentData.successfulPayment != null) {

        paymentData = inputs.paymentData;
        paymentId = inputs.paymentData.successfulPayment.invoice_payload;
      }

      await Payments.create({
        payment_id: paymentId,
        payment_status: inputs.paymentStatus,
        payment_data: paymentData,
        payment_response: inputs.paymentResponse,
        payment_provider: inputs.paymentProvider,
        messenger: inputs.messenger,
        comments: inputs.comments || '',
        client_id: inputs.clientId,
        client_guid: inputs.clientGuid,
        account_guid: inputs.accountGuid,
        type: inputs.type,
        amount: inputs.amount,
        currency: inputs.currency,
      });

      return exits.success({
        status: 'ok',
        message: 'Payment record created',
        payload: {},
      })

    } catch (e) {

      const errorLocation = 'api/helpers/storage/payment-create';
      const errorMsg = sails.config.custom.PAYMENT_CREATE_ERROR;

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


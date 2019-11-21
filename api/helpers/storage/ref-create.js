"use strict";

module.exports = {


  friendlyName: 'Referral table record create',


  description: 'Create referral record',


  inputs: {

    clientGuid: {
      friendlyName: 'Client guid',
      description: 'Client guid',
      type: 'string',
      required: true,
    },

    refUp: {
      friendlyName: 'Referral upwards',
      description: 'Referral upwards',
      type: 'ref',
      required: true,
    },

    refDown: {
      friendlyName: 'Referral downwards',
      description: 'Referral downwards',
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


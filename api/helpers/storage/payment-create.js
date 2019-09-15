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
      friendlyName: 'currency',
      description: 'currency',
      type: 'string',
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

      await Payments.create({
        payment_id: paymentId,
        payment_status: inputs.paymentStatus,
        payment_data: paymentData,
        payment_response: inputs.paymentResponse,
        payment_provider: inputs.paymentProvider,
        messenger: inputs.messenger,
        client_id: inputs.clientId,
        client_guid: inputs.clientGuid,
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


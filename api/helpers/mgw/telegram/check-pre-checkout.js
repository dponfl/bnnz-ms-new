"use strict";

module.exports = {

  friendlyName: 'Check pre_checkout data',


  description: 'Check pre_checkout data',


  inputs: {

    paymentResponse: {
      friendlyName: 'payment response',
      description: 'payment response',
      type: 'ref',
      required: true,
    },

  },

  exits: {
    success: {
      description: 'All done.',
    },
  },

  fn: async function(inputs, exits) {

    // sails.log.info('************************* Telegram checkPreCheckout: ', inputs);

    try {

      if (inputs.paymentResponse.invoice_payload == null) {
        throw new Error(`checkPreCheckout, No invoice_payload: ${inputs.paymentResponse}`);
      }

      const paymentId = inputs.paymentResponse.invoice_payload;

      const invoiceRaw = await sails.helpers.storage.paymentGetByIdAndStatus.with({
        paymentId: paymentId,
        paymentStatus: sails.config.custom.enums.paymentStatus.INVOICE,
      });

      if (invoiceRaw.status !== 'ok') {
        throw new Error(`checkPreCheckout, No invoice found: ${invoiceRaw}`);
      }

      const invoice = invoiceRaw.payload;

      // sails.log.info('**************** invoice: ', invoice);

      if (invoice.payment_response.chat.id !== inputs.paymentResponse.from.id
        || invoice.payment_response.invoice.total_amount !== inputs.paymentResponse.total_amount
        || invoice.payment_response.invoice.currency !== inputs.paymentResponse.currency
      ) {
        throw new Error(`checkPreCheckout, Pre_checkout response does not corresponds invoice, invoice: ${invoice} Pre_checkout: ${inputs.paymentResponse}`);
      }

      return exits.success({
        status: 'ok',
        message: sails.config.custom.CHECK_PRE_CHECKOUT_OK,
        payload: {
          paymentId: paymentId,
        },
      });


    } catch (e) {

      const errorLocation = 'api/helpers/pgw/yandex/check-pre-checkout';
      const errorMsg = sails.config.custom.CHECK_PRE_CHECKOUT_ERROR;

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
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

      // sails.log.warn('checkPreCheckout...');


      if (inputs.paymentResponse.invoice_payload == null) {
        // sails.log.error(`checkPreCheckout, No invoice_payload: ${inputs.paymentResponse}`);
        // throw new Error(`checkPreCheckout, No invoice_payload: ${inputs.paymentResponse}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'No invoice_payload',
          errorName: sails.config.custom.MGW_TELEGRAM_ERROR,
          payload: {
            paymentResponse: inputs.paymentResponse,
          },
        });

      }

      const paymentId = inputs.paymentResponse.invoice_payload;

      const invoiceRaw = await sails.helpers.storage.paymentGetByIdAndStatus.with({
        paymentId: paymentId,
        paymentStatus: sails.config.custom.enums.paymentStatus.INVOICE,
      });

      if (invoiceRaw.status !== 'ok') {
        // sails.log.error(`checkPreCheckout, No invoice found: ${invoiceRaw}`);
        // throw new Error(`checkPreCheckout, No invoice found: ${invoiceRaw}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'No invoice found',
          errorName: sails.config.custom.MGW_TELEGRAM_ERROR,
          payload: {
            invoiceRaw,
          },
        });

      }

      const invoice = invoiceRaw.payload;

      // sails.log.info('**************** invoice: ', invoice);

      if (invoice.payment_response.chat.id !== inputs.paymentResponse.from.id
        || invoice.payment_response.invoice.total_amount !== inputs.paymentResponse.total_amount
        || invoice.payment_response.invoice.currency !== inputs.paymentResponse.currency
      ) {
        // sails.log.error(`checkPreCheckout, Pre_checkout response does not corresponds invoice, invoice: ${invoice} Pre_checkout: ${inputs.paymentResponse}`);
        // throw new Error(`checkPreCheckout, Pre_checkout response does not corresponds invoice, invoice: ${invoice} Pre_checkout: ${inputs.paymentResponse}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Pre_checkout response does not corresponds invoice',
          errorName: sails.config.custom.MGW_TELEGRAM_ERROR,
          payload: {
            invoice,
            paymentResponse: inputs.paymentResponse,
          },
        });

      }

      return exits.success({
        status: 'ok',
        message: sails.config.custom.CHECK_PRE_CHECKOUT_OK,
        payload: {
          paymentId: paymentId,
        },
      });


    } catch (e) {

      // const errorLocation = 'api/helpers/pgw/yandex/check-pre-checkout';
      // const errorMsg = sails.config.custom.CHECK_PRE_CHECKOUT_ERROR;
      //
      // sails.log.error(errorLocation + ', error: ' + errorMsg);
      // sails.log.error(errorLocation + ', error details: ', e);
      //
      // throw {err: {
      //     module: errorLocation,
      //     message: errorMsg,
      //     payload: {
      //       error: e,
      //     },
      //   }
      // };

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
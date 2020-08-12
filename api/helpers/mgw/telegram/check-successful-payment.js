"use strict";

const moduleName = 'mgw:telegram:check-successful-payment';

module.exports = {

  friendlyName: 'Check successful payment data',


  description: 'Check successful payment data',


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

    // sails.log.info('************************* Telegram checkSuccessfulPayment: ', inputs);

    try {

      if (inputs.paymentResponse.successful_payment.invoice_payload == null) {
        // throw new Error(`checkSuccessfulPayment, No invoice_payload: ${inputs.paymentResponse}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'No invoice_payload',
          errorName: sails.config.custom.MGW_TELEGRAM_ERROR.name,
          payload: {
            paymentResponse: inputs.paymentResponse,
          },
        });

      }

      const paymentId = inputs.paymentResponse.successful_payment.invoice_payload;

      const invoiceRaw = await sails.helpers.storage.paymentGetByIdAndStatus.with({
        paymentId: paymentId,
        paymentStatus: sails.config.custom.enums.paymentStatus.INVOICE,
      });

      if (invoiceRaw.status !== 'ok') {
        // throw new Error(`checkSuccessfulPayment, No invoice found: ${invoiceRaw}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'No invoice found',
          errorName: sails.config.custom.MGW_TELEGRAM_ERROR.name,
          payload: {
            invoiceRaw,
          },
        });

      }

      const invoice = invoiceRaw.payload;

      // sails.log.info('**************** invoice: ', invoice);

      if (invoice.payment_response.chat.id !== inputs.paymentResponse.chat.id
        || invoice.payment_response.invoice.total_amount !== inputs.paymentResponse.successful_payment.total_amount
        || invoice.payment_response.invoice.currency !== inputs.paymentResponse.successful_payment.currency
      ) {
        // throw new Error(`checkSuccessfulPayment, SuccessfulPayment response does not corresponds invoice, invoice: ${invoice} SuccessfulPayment: ${inputs.paymentResponse.successful_payment}`);

        /**
         * В этом случае не нужно бросать ошибку (для обработки этого кейса отдельно)
         */

        return exits.success({
          status: 'error',
          message: sails.config.custom.CHECK_SUCCESSFUL_PAYMENT_ERROR,
          payload: {
            errorMessage: `${moduleName}, successful_payment response does not corresponds invoice:
            invoice: ${JSON.stringify(invoice, null, 3)} 
            successful_payment: ${JSON.stringify(inputs.paymentResponse.successful_payment, null, 3)}`
          },
        });

      }

      return exits.success({
        status: 'ok',
        message: sails.config.custom.CHECK_SUCCESSFUL_PAYMENT_OK,
        payload: {
          paymentId: paymentId,
        },
      });


    } catch (e) {

      // const errorLocation = moduleName;
      // const errorMsg = `${moduleName}: ${sails.config.custom.CHECK_SUCCESSFUL_PAYMENT_ERROR}`;
      //
      // sails.log.error(errorLocation + ', error: ' + errorMsg);
      // sails.log.error(errorLocation + ', error details: ', e);
      //
      // throw {
      //   err: {
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
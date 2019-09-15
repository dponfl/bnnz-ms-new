"use strict";

module.exports = {

  friendlyName: 'Payment get by payment id',


  description: 'Get payment record by payment id',

  inputs: {

    paymentId: {
      friendlyName: 'payment id',
      description: 'payment id',
      type: 'string',
      required: true,
    },

    paymentStatus: {
      friendlyName: 'payment status',
      description: 'payment status',
      type: 'string',
      required: true,
    },

  },

  exits: {

    success: {
      description: 'All done.',
    },

  },

  fn: async function(inputs, exits) {

    // sails.log.info('************************* paymentGetByIdAndStatus: ', inputs);

    try {

      const paymentRecord = await Payments.findOne({
        payment_id: inputs.paymentId,
        payment_status: inputs.paymentStatus,
      });

      if (paymentRecord == null) {

        /**
         * Record for the specified payment was not found
         */

        return exits.success({
          status: 'nok',
          message: sails.config.custom.PAYMENT_RECORD_NOT_FOUND,
          payload: {
            paymentId: inputs.paymentId,
            paymentStatus: inputs.paymentStatus,
          },
        });

      }

      return exits.success({
        status: 'ok',
        message: sails.config.custom.PAYMENT_RECORD_FOUND,
        payload: paymentRecord,
      });

    } catch (e) {

      const errorLocation = 'api/helpers/storage/payment-get-by-id-and-status';
      const errorMsg = sails.config.custom.PAYMENT_GET_BY_PAYMENT_ID_ERROR;

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

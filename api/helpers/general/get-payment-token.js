"use strict";

const moduleName = 'general:getPaymentToken';

module.exports = {

  friendlyName: 'Get payment token',

  description: 'Get payment token',

  inputs: {
    messenger: {
      friendlyName: 'messenger',
      description: 'Messenger name',
      type: 'string',
      required: true,
    },
  },

  exits: {

    success: {
      description: 'All done.',    },

  },


  fn: async function (inputs, exits) {

    // sails.log.info('******************** ' + moduleName + ' ********************');

    try {

      const paymentProvider = sails.config.custom.config.payments[inputs.messenger]['provider'].toUpperCase() +
      '_' + sails.config.custom.config.payments[inputs.messenger]['env'].toUpperCase();

      if (paymentProvider == null) {
        throw new Error(`Critical error: Cannot get payment provider from config, config.payments: ${sails.config.custom.config.paymens}`);
      }

      const paymentProviderTokenKey = paymentProvider + '_TOKEN';

      const paymentProviderToken = process.env[paymentProviderTokenKey];

      if (paymentProviderToken == null) {
        throw new Error('Critical error: Cannot get payment provider token value');
      }

      return exits.success({
        status: 'ok',
        message: 'Got payment provider token',
        payload: {
          paymentProviderToken: paymentProviderToken,
        }
      });

    } catch (e) {

      const errorLocation = 'api/helpers/general/get-payment-token';
      const errorMsg = 'api/helpers/general/get-payment-token error';

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
        }
      };

    }

  } // fn


};


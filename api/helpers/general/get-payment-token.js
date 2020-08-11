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
        // throw new Error(`Critical error: Cannot get payment provider from config, config.payments: ${sails.config.custom.config.payments}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
          location: moduleName,
          message: 'Cannot get payment provider from config',
          errorName: sails.config.custom.GENERAL_ERROR,
          payload: {
            messenger: inputs.messenger,
          },
        });

      }

      const paymentProviderTokenKey = paymentProvider + '_TOKEN';

      const paymentProviderToken = process.env[paymentProviderTokenKey];

      if (paymentProviderToken == null) {
        // throw new Error('Critical error: Cannot get payment provider token value');

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
          location: moduleName,
          message: 'Cannot get payment provider token value',
          errorName: sails.config.custom.GENERAL_ERROR,
          payload: {
            paymentProvider,
          },
        });

      }

      return exits.success({
        status: 'ok',
        message: 'Got payment provider token',
        payload: {
          paymentProviderToken: paymentProviderToken,
        }
      });

    } catch (e) {

      // const errorLocation = 'api/helpers/general/get-payment-token';
      // const errorMsg = 'api/helpers/general/get-payment-token error';
      //
      // sails.log.error(errorLocation + ', error: ' + errorMsg);
      // sails.log.error(errorLocation + ', error details: ', e);
      //
      // throw {err: {
      //     module: errorLocation,
      //     message: errorMsg,
      //     payload: {},
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

  } // fn


};


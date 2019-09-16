"use strict";

module.exports = {

  friendlyName: 'On successful_payment message',


  description: 'Manage successful_payment Telegram messages',


  inputs: {

  },


  exits: {

    success: {
      description: 'All done.',
    },

    err: {
      description: 'Error',
    }

  },

  fn: async function(inputs, exits) {

    sails.log.info('******************** telegramListener.onSuccessfulPayment ********************');

    sails.config.custom.telegramBot.on('successful_payment', async (msg) => {

      try {

        const paymentProviderAndEnv = sails.config.custom.config.payments.telegram.provider.toUpperCase() +
          '_' + sails.config.custom.config.payments.telegram.env.toUpperCase();

        const clientRaw = await sails.helpers.storage.clientGet.with({
          messenger: sails.config.custom.enums.messenger.TELEGRAM,
          msg: msg,
        });

        if (clientRaw == null || clientRaw.status !== 'found') {

          await sails.helpers.storage.paymentCreate.with({
            paymentStatus: sails.config.custom.enums.paymentStatus.SUCCESS_ERROR,
            paymentData: {
            },
            paymentResponse: msg,
            paymentProvider: paymentProviderAndEnv,
            messenger: sails.config.custom.enums.messenger.TELEGRAM,
            comments: `Client record not found for chatId: ${msg.chat.id}`,
            clientId: 'client not found',
            clientGuid: 'client not found',
          });

          throw new Error(`Client record not found, msg: ${msg} Messenger: ${sails.config.custom.enums.messenger.TELEGRAM}`);
        }

        const client = clientRaw.payload;


        const checkSuccessfulPaymentResult = await sails.helpers.mgw.telegram.checkSuccessfulPayment.with({
          paymentResponse: msg,
        });

        if (checkSuccessfulPaymentResult.status === 'ok') {

          await sails.helpers.storage.paymentCreate.with({
            paymentStatus: sails.config.custom.enums.paymentStatus.SUCCESS,
            paymentData: {
              successfulPayment: msg.successful_payment,
            },
            paymentResponse: msg,
            paymentProvider: paymentProviderAndEnv,
            messenger: sails.config.custom.enums.messenger.TELEGRAM,
            clientId: client.id,
            clientGuid: client.guid,
          });

        }

      } catch (e) {

        const errorLocation = 'api/helpers/chat-listeners/telegram/on-successful-payment.js';
        const errorMsg = sails.config.custom.ON_SUCCESSFUL_PAYMENT_ERROR;

        sails.log.error(errorLocation + ', error: ' + errorMsg);
        sails.log.error(errorLocation + ', error details: ', e);

        throw {err: {
            module: errorLocation,
            message: errorMsg,
            payload: {},
          }
        };

      }

    });

    /**
     * The below return needed for normal functioning of config/bootstrap.js
     */

    return exits.success({
      status: 'ok',
      message: 'success',
      payload: {}
    });

  }

};

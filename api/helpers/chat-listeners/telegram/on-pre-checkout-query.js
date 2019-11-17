"use strict";

module.exports = {

  friendlyName: 'On pre_checkout_query message',


  description: 'Manage pre_checkout_query Telegram messages',


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

    sails.log.info('******************** telegramListener.onPreCheckoutQuery ********************');

    sails.config.custom.telegramBot.on('pre_checkout_query', async (msg) => {

      try {

        const paymentProviderAndEnv = sails.config.custom.config.payments.telegram.provider.toUpperCase() +
          '_' + sails.config.custom.config.payments.telegram.env.toUpperCase();

        const clientRaw = await sails.helpers.storage.clientGet.with({
          messenger: sails.config.custom.enums.messenger.TELEGRAM,
          msg: {
            chat: {
              id: msg.from.id,
            }
          }
        });

        if (clientRaw == null || clientRaw.status !== 'found') {

          await sails.helpers.storage.paymentCreate.with({
            paymentStatus: sails.config.custom.enums.paymentStatus.PRECHECKOUT_ERROR,
            paymentData: {
            },
            paymentResponse: msg,
            paymentProvider: paymentProviderAndEnv,
            messenger: sails.config.custom.enums.messenger.TELEGRAM,
            comments: `Client record not found for chatId: ${msg.from.id}`,
            clientId: 'client not found',
            clientGuid: 'client not found',
            accountGuid: 'no account',
          });

          throw new Error(`Client record not found, msg: ${msg} Messenger: ${sails.config.custom.enums.messenger.TELEGRAM}`);
        }

        const client = clientRaw.payload;

        const paymentProvider = sails.config.custom.config.payments[sails.config.custom.enums.messenger.TELEGRAM]['provider'].toLowerCase();

        if (paymentProvider == null) {

          await sails.helpers.storage.paymentCreate.with({
            paymentStatus: sails.config.custom.enums.paymentStatus.PRECHECKOUT_ERROR,
            paymentData: {
            },
            paymentResponse: msg,
            paymentProvider: paymentProviderAndEnv,
            messenger: sails.config.custom.enums.messenger.TELEGRAM,
            comments: 'Config has no payment provider',
            clientId: client.id,
            clientGuid: client.guid,
            accountGuid: client.account_use,
          });

          throw new Error(`No payment provider, config: ${sails.config.custom.config.payments[sails.config.custom.enums.messenger.TELEGRAM]}`);
        }

        const checkInvoiceResult = await sails.helpers.mgw.telegram.checkPreCheckout.with({
          paymentResponse: msg,
        });

        if (checkInvoiceResult.status === 'ok') {

          const answerPreCheckoutQueryResult = await sails.helpers.mgw.telegram.answerPreCheckoutQuery.with({
            client: client,
            preCheckoutQuery: msg,
            isOk: true,
          });

          if (answerPreCheckoutQueryResult.status !== 'ok') {
            throw new Error(`answerPreCheckoutQueryResult not successful, answerPreCheckoutQueryResult: ${answerPreCheckoutQueryResult}`);
          }

        }

      } catch (e) {

        const errorLocation = 'api/helpers/chat-listeners/telegram/on-pre-checkout-query';
        const errorMsg = sails.config.custom.ON_PRE_CHECKOUT_QUERY_ERROR;

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

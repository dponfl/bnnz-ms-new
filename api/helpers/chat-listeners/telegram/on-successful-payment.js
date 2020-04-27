"use strict";

const moduleName = 'chat-listeners:telegram:on-successful-payment.js';


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
            accountGuid: client.account_use,
            type: sails.config.custom.enums.paymentType.DEPOSIT,
            amount: msg.successful_payment.total_amount/100 || 0,
            currency: msg.successful_payment.currency || 'XXX',
          });

          const accountRecRaw = await sails.helpers.storage.accountGetJoi({
            accountGuids: [client.account_use],
          });

          if (accountRecRaw.status !== 'ok') {
            throw new Error(`${moduleName}, error: account record not found for account guid: ${client.account_use}`);
          }

          const accountRec = accountRecRaw.payload;

          if (
            accountRec.payment_amount != msg.successful_payment.total_amount
            || accountRec.payment_currency.toUpperCase() != msg.successful_payment.currency.toUpperCase()
          ) {
            throw new Error(`${moduleName}, error: wrong payment_amount or payment_currency:
            account record:
              payment_amount: ${accountRec.payment_amount}
              payment_currency: ${accountRec.payment_currency.toUpperCase()}
            payment provider response:
              payment_amount: ${msg.successful_payment.total_amount}
              payment_currency: ${msg.successful_payment.currency.toUpperCase()}`);
          }

          await sails.helpers.storage.accountUpdateJoi({
            criteria: {guid: accountRec.guid},
            data: {
              payment_amount: null,
              payment_currency: null,
            }
          });

          /**
           * Информируем процесс, что получено подтверждение успешного платежа
           */

          const confirmPaymentRes = await sails.helpers.general.confirmPaymentNewJoi({

          });

          if (confirmPaymentRes.status !== 'ok') {
            throw new Error(`${moduleName}, error: confirmPaymentNewJoi error`);
          }

        }

      } catch (e) {

        const errorLocation = 'api/helpers/chat-listeners/telegram/on-successful-payment.js';
        const errorMsg = sails.config.custom.ON_SUCCESSFUL_PAYMENT_ERROR;

        sails.log.error(errorLocation + ', error: ' + errorMsg);
        sails.log.error(errorLocation + ', error details: ', e);

        throw {err: {
            module: errorLocation,
            message: errorMsg,
            payload: {
              error: e,
            },
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

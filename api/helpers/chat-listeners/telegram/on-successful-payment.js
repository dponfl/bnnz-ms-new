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

    sails.config.custom.telegramBot.on('successful_payment', async (msg) => {

      let paymentGroupGuid;

      try {

        if (_.isNil(msg.successful_payment.invoice_payload)) {
          // throw new Error(`${moduleName}, error: no msg.successful_payment.invoice_payload:
          // ${JSON.stringify(msg, null, 3)}`);

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'No msg.successful_payment.invoice_payload',
            errorName: sails.config.custom.CHAT_LISTENER_TELEGRAM_ERROR.name,
            payload: {
              msg,
            },
          });

        }

        paymentGroupGuid = msg.successful_payment.invoice_payload;

        const clientRaw = await sails.helpers.storage.clientGet.with({
          messenger: sails.config.custom.enums.messenger.TELEGRAM,
          msg: msg,
        });

        if (clientRaw == null || clientRaw.status !== 'found') {

          // throw new Error(`${moduleName}, error: client record not found:
          // msg: ${JSON.stringify(msg, null, 3)}
          // messenger: ${sails.config.custom.enums.messenger.TELEGRAM}`);

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'client record not found',
            errorName: sails.config.custom.CHAT_LISTENER_TELEGRAM_ERROR.name,
            payload: {
              msg,
            },
          });

        }

        const client = clientRaw.payload;


        const checkSuccessfulPaymentResult = await sails.helpers.mgw.telegram.checkSuccessfulPayment.with({
          paymentResponse: msg,
        });

        if (checkSuccessfulPaymentResult.status === 'ok') {

          await sails.helpers.storage.paymentCreateJoi({
            paymentGroupGuid,
            paymentStatus: sails.config.custom.enums.paymentStatus.SUCCESS,
            paymentData: {
              successfulPayment: msg.successful_payment,
            },
            paymentResponse: msg,
            clientId: client.id,
            clientGuid: client.guid,
            accountGuid: client.account_use,
            amount: msg.successful_payment.total_amount/sails.config.custom.config.price[msg.successful_payment.currency.toUpperCase()].transform_to_min_price_unit || 0,
            currency: msg.successful_payment.currency || 'XXX',
          });

          // TODO: Заменить на метод storage.paymentGroupUpdateJoi
          await PaymentGroups.update({guid: paymentGroupGuid}).set({status: sails.config.custom.enums.paymentGroupStatus.SUCCESS})

          const accountRecRaw = await sails.helpers.storage.accountGetJoi({
            accountGuids: [client.account_use],
          });

          if (accountRecRaw.status !== 'ok') {
            // throw new Error(`${moduleName}, error: account record not found for account guid: ${client.account_use}`);

            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'account record not found for account guid',
              clientGuid: client.guid,
              accountGuid: client.account_use,
              errorName: sails.config.custom.CHAT_LISTENER_TELEGRAM_ERROR.name,
              payload: {
                accountGuid: client.account_use,
              },
            });

          }

          const accountRec = accountRecRaw.payload[0];

          await sails.helpers.storage.accountUpdateJoi({
            criteria: {guid: accountRec.guid},
            data: {
              payment_amount: null,
              payment_currency: null,
            },
            createdBy: moduleName,
          });

          /**
           * Информируем процесс, что получено подтверждение успешного платежа
           */

          await sails.helpers.general.processPaymentSuccessJoi({
            paymentGroupGuid,
            chatId: client.chat_id,
            messenger: sails.config.custom.enums.messenger.TELEGRAM,
          });


        } else {

          sails.log.error(checkSuccessfulPaymentResult.payload.errorMessage);

          await sails.helpers.storage.paymentCreateJoi({
            paymentGroupGuid,
            paymentStatus: sails.config.custom.enums.paymentStatus.SUCCESS_ERROR,
            paymentData: {
              successfulPayment: msg.successful_payment,
            },
            paymentResponse: msg,
            clientId: client.id,
            clientGuid: client.guid,
            accountGuid: client.account_use,
            amount: msg.successful_payment.total_amount/sails.config.custom.config.price[msg.successful_payment.currency.toUpperCase()].transform_to_min_price_unit || 0,
            currency: msg.successful_payment.currency || 'XXX',
            comments: checkSuccessfulPaymentResult.payload.errorMessage,
          });

          await sails.helpers.general.processPaymentErrorJoi({
            paymentGroupGuid,
            chatId: client.chat_id,
            messenger: sails.config.custom.enums.messenger.TELEGRAM,
          });

        }

      } catch (e) {

        // const errorLocation = 'api/helpers/chat-listeners/telegram/on-successful-payment.js';
        // const errorMsg = sails.config.custom.ON_SUCCESSFUL_PAYMENT_ERROR;
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

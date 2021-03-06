"use strict";

const moduleName = 'chat-listeners:telegram:on-pre-checkout-query';

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

    sails.config.custom.telegramBot.on('pre_checkout_query', async (msg) => {

      let paymentGroupGuid = sails.config.custom.enums.dummyGuid;
      const chatId = msg.from.id || 0;

      /**
       * Разкомментировать для проверки работы воронки в случае ошибки платежа
       */
      // msg.invoice_payload = null;

      try {

        if (_.isNil(msg.invoice_payload)) {
          // sails.log.error(`${moduleName}, error: no msg.invoice_payload:
          // ${JSON.stringify(msg, null, 3)}`);
          // throw new Error(`${moduleName}, error: no msg.invoice_payload:
          // ${JSON.stringify(msg, null, 3)}`);

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'No msg.invoice_payload',
            errorName: sails.config.custom.CHAT_LISTENER_TELEGRAM_ERROR.name,
            payload: {
              msg,
            },
          });

        }

        paymentGroupGuid = msg.invoice_payload;

        const clientRaw = await sails.helpers.storage.clientGet.with({
          messenger: sails.config.custom.enums.messenger.TELEGRAM,
          msg: {
            chat: {
              id: msg.from.id,
            }
          }
        });

        if (clientRaw == null || clientRaw.status !== 'found') {

          // sails.log.error(`${moduleName}, error: client record not found:
          // msg: ${JSON.stringify(msg, null, 3)}
          // messenger: ${sails.config.custom.enums.messenger.TELEGRAM}`);
          //
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
              clientRaw,
            },
          });

        }

        const client = clientRaw.payload;

        const paymentProvider = sails.config.custom.config.payments[sails.config.custom.enums.messenger.TELEGRAM]['provider'].toLowerCase();

        if (paymentProvider == null) {

          await sails.helpers.storage.paymentCreateJoi({
            paymentGroupGuid,
            paymentStatus: sails.config.custom.enums.paymentStatus.PRECHECKOUT_ERROR,
            paymentData: {
            },
            paymentResponse: msg,
            comments: 'Config has no payment provider',
            clientId: client.id,
            clientGuid: client.guid,
            accountGuid: client.account_use,
          });

          // sails.log.error(`${moduleName}, error: no payment provider for ${sails.config.custom.enums.messenger.TELEGRAM}:
          // config: ${JSON.stringify(sails.config.custom.config.payments[sails.config.custom.enums.messenger.TELEGRAM], null, 3)}`);
          //
          // throw new Error(`${moduleName}, error: no payment provider for ${sails.config.custom.enums.messenger.TELEGRAM}:
          // config: ${JSON.stringify(sails.config.custom.config.payments[sails.config.custom.enums.messenger.TELEGRAM], null, 3)}`);

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
            location: moduleName,
            message: `no payment provider for ${sails.config.custom.enums.messenger.TELEGRAM}`,
            clientGuid: client.guid,
            accountGuid: client.account_use,
            errorName: sails.config.custom.CHAT_LISTENER_TELEGRAM_ERROR.name,
            payload: sails.config.custom.config.payments[sails.config.custom.enums.messenger.TELEGRAM],
          });

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
            // sails.log.error(`answerPreCheckoutQueryResult not successful, answerPreCheckoutQueryResult: ${JSON.stringify(answerPreCheckoutQueryResult, null, 3)}`);
            // throw new Error(`answerPreCheckoutQueryResult not successful, answerPreCheckoutQueryResult: ${JSON.stringify(answerPreCheckoutQueryResult, null, 3)}`);

            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.ERROR,
              location: moduleName,
              message: 'answerPreCheckoutQueryResult not successful',
              clientGuid: client.guid,
              accountGuid: client.account_use,
              errorName: sails.config.custom.CHAT_LISTENER_TELEGRAM_ERROR.name,
              payload: {
                answerPreCheckoutQueryResult,
              },
            });

          }

        } else {
          // sails.log.error(`${moduleName}, error: checkInvoiceResult.status != ok:
          // ${JSON.stringify(checkInvoiceResult, null, 3)}`);
          // throw new Error(`${moduleName}, error: checkInvoiceResult.status != ok:
          // ${JSON.stringify(checkInvoiceResult, null, 3)}`);

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'checkInvoiceResult.status NOT ok',
            clientGuid: client.guid,
            accountGuid: client.account_use,
            errorName: sails.config.custom.CHAT_LISTENER_TELEGRAM_ERROR.name,
            payload: {
              checkInvoiceResult,
            },
          });

        }

      } catch (e) {

        // const errorLocation = moduleName;
        // const errorMsg = `${moduleName}, error: ${sails.config.custom.ON_PRE_CHECKOUT_QUERY_ERROR}`;
        //
        // sails.log.error(errorLocation + ', error: ' + errorMsg);
        // sails.log.error(errorLocation + ', error details: ', e);
        //
        // try {
        //
        //   await sails.helpers.general.processPaymentErrorJoi({
        //     paymentGroupGuid,
        //     chatId,
        //     messenger: sails.config.custom.enums.messenger.TELEGRAM,
        //   });
        //
        // } catch (ee) {
        //
        //   const errorLocation = moduleName;
        //   const errorMsg = `${moduleName}: processPaymentErrorJoi call error`;
        //
        //   sails.log.error(errorLocation + ', error: ' + errorMsg);
        //   sails.log.error(errorLocation + ', error details: ', ee);
        //
        //   throw {err: {
        //       module: errorLocation,
        //       message: errorMsg,
        //       payload: {
        //         error: ee,
        //       },
        //     }
        //   };
        //
        // }
        //
        // throw {err: {
        //     module: errorLocation,
        //     message: errorMsg,
        //     payload: {
        //       error: e,
        //     },
        //   }
        // };


        await sails.helpers.general.processPaymentErrorJoi({
          paymentGroupGuid,
          chatId,
          messenger: sails.config.custom.enums.messenger.TELEGRAM,
        });

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

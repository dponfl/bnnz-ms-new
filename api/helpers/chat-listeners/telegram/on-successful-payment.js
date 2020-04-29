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

        // sails.log.warn('successful_payment...');


        if (_.isNil(msg.successful_payment.invoice_payload)) {
          throw new Error(`${moduleName}, error: no msg.successful_payment.invoice_payload:
          ${JSON.stringify(msg, null, 3)}`);
        }

        // const paymentId = msg.successful_payment.invoice_payload;
        //
        //
        // //TODO: Заменить на метод storage.paymentGetJoi (нужно его создать)
        // const invoiceRec = await Payments.findOne({
        //   payment_id: paymentId,
        //   payment_status: sails.config.custom.enums.paymentStatus.INVOICE,
        // });
        //
        // if (invoiceRec == null) {
        //   throw new Error(`${moduleName}, error: no invoice payment record found for ${paymentId}`);
        // }
        //
        // const paymentGroupGuid = invoiceRec.paymentGroupGuid;


        const paymentGroupGuid = msg.successful_payment.invoice_payload;

        const paymentProviderAndEnv = sails.config.custom.config.payments.telegram.provider.toUpperCase() +
          '_' + sails.config.custom.config.payments.telegram.env.toUpperCase();

        const clientRaw = await sails.helpers.storage.clientGet.with({
          messenger: sails.config.custom.enums.messenger.TELEGRAM,
          msg: msg,
        });

        if (clientRaw == null || clientRaw.status !== 'found') {

          // await sails.helpers.storage.paymentCreateJoi({
          //   paymentStatus: sails.config.custom.enums.paymentStatus.SUCCESS_ERROR,
          //   paymentData: {
          //   },
          //   paymentResponse: msg,
          //   comments: `Client record not found for chatId: ${msg.chat.id}`,
          //   clientId: 'client not found',
          //   clientGuid: 'client not found',
          // });

          throw new Error(`${moduleName}, error: client record not found:
          msg: ${JSON.stringify(msg, null, 3)} 
          messenger: ${sails.config.custom.enums.messenger.TELEGRAM}`);
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
            amount: msg.successful_payment.total_amount/100 || 0,
            currency: msg.successful_payment.currency || 'XXX',
          });

          // TODO: Заменить на метод storage.paymentGroupUpdateJoi
          await PaymentGroups.update({guid: paymentGroupGuid}).set({status: sails.config.custom.enums.paymentGroupStatus.SUCCESS})

          const accountRecRaw = await sails.helpers.storage.accountGetJoi({
            accountGuids: [client.account_use],
          });

          if (accountRecRaw.status !== 'ok') {
            throw new Error(`${moduleName}, error: account record not found for account guid: ${client.account_use}`);
          }

          const accountRec = accountRecRaw.payload[0];

          if (
            accountRec.payment_amount * sails.config.custom.config.price[accountRec.payment_currency.toUpperCase()].transform_to_min_price_unit != msg.successful_payment.total_amount
            || accountRec.payment_currency.toUpperCase() != msg.successful_payment.currency.toUpperCase()
          ) {
            sails.log.error(`${moduleName}, error: wrong payment_amount or payment_currency:
            account record:
              payment_amount: ${accountRec.payment_amount}
              payment_currency: ${accountRec.payment_currency.toUpperCase()}
            payment provider response:
              payment_amount: ${msg.successful_payment.total_amount}
              payment_currency: ${msg.successful_payment.currency.toUpperCase()}`);
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

          // const accountIndex = _.findIndex(client.accounts, {guid: client.account_use});
          //
          // if (accountIndex < 0) {
          //   throw new Error(`${moduleName}, error: account not found:
          //   client.account_use: ${client.account_use}
          //   client.accounts: ${JSON.stringify(client.accounts, null, 3)}`);
          // }
          //
          // client.accounts[accountIndex].payment_amount = null;
          // client.accounts[accountIndex].payment_currency = null;


          /**
           * Информируем процесс, что получено подтверждение успешного платежа
           */

          // const confirmPaymentRes = await sails.helpers.general.confirmPaymentNewJoi({
          //
          // });
          //
          // if (confirmPaymentRes.status !== 'ok') {
          //   throw new Error(`${moduleName}, error: confirmPaymentNewJoi error`);
          // }

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

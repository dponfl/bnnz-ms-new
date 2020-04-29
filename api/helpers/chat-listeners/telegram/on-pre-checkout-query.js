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

    sails.log.info('******************** telegramListener.onPreCheckoutQuery ********************');

    sails.config.custom.telegramBot.on('pre_checkout_query', async (msg) => {

      // sails.log.warn('pre_checkout_query...');

      try {

        if (_.isNil(msg.invoice_payload)) {
          sails.log.error(`${moduleName}, error: no msg.invoice_payload:
          ${JSON.stringify(msg, null, 3)}`);
          throw new Error(`${moduleName}, error: no msg.invoice_payload:
          ${JSON.stringify(msg, null, 3)}`);
        }

        // const paymentId = msg.invoice_payload;
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

        const paymentGroupGuid = msg.invoice_payload;

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

          // await sails.helpers.storage.paymentCreateJoi({
          //   paymentStatus: sails.config.custom.enums.paymentStatus.PRECHECKOUT_ERROR,
          //   paymentData: {
          //   },
          //   paymentResponse: msg,
          //   comments: `Client record not found for chat_id: ${msg.from.id}`,
          //   clientId: 'client not found',
          //   clientGuid: 'client not found',
          //   accountGuid: 'no account',
          // });

          sails.log.error(`${moduleName}, error: client record not found:
          msg: ${JSON.stringify(msg, null, 3)} 
          messenger: ${sails.config.custom.enums.messenger.TELEGRAM}`);

          throw new Error(`${moduleName}, error: client record not found:
          msg: ${JSON.stringify(msg, null, 3)} 
          messenger: ${sails.config.custom.enums.messenger.TELEGRAM}`);
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

          sails.log.error(`${moduleName}, error: no payment provider for ${sails.config.custom.enums.messenger.TELEGRAM}: 
          config: ${JSON.stringify(sails.config.custom.config.payments[sails.config.custom.enums.messenger.TELEGRAM], null, 3)}`);

          throw new Error(`${moduleName}, error: no payment provider for ${sails.config.custom.enums.messenger.TELEGRAM}: 
          config: ${JSON.stringify(sails.config.custom.config.payments[sails.config.custom.enums.messenger.TELEGRAM], null, 3)}`);
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
            sails.log.error(`answerPreCheckoutQueryResult not successful, answerPreCheckoutQueryResult: ${JSON.stringify(answerPreCheckoutQueryResult, null, 3)}`);
            throw new Error(`answerPreCheckoutQueryResult not successful, answerPreCheckoutQueryResult: ${JSON.stringify(answerPreCheckoutQueryResult, null, 3)}`);
          }

        } else {
          sails.log.error(`${moduleName}, checkInvoiceResult.status != ok:
          ${JSON.stringify(checkInvoiceResult, null, 3)}`);
        }

      } catch (e) {

        const errorLocation = moduleName;
        const errorMsg = `${moduleName}, error: ${sails.config.custom.ON_PRE_CHECKOUT_QUERY_ERROR}`;

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

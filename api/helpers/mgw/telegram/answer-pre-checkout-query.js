"use strict";

module.exports = {

  friendlyName: 'answerPreCheckoutQuery',


  description: 'answerPreCheckoutQuery',


  inputs: {

    client: {
      friendlyName: 'client',
      description: 'client',
      type: 'ref',
      required: true,
    },

    preCheckoutQuery: {
      friendlyName: 'preCheckoutQueryId',
      description: 'preCheckoutQueryId',
      type: 'ref',
      required: true,
    },

    isOk: {
      friendlyName: 'isOk',
      description: 'isOk',
      type: 'boolean',
      required: true,
    },

    errorMessage: {
      friendlyName: 'error_message',
      description: 'error_message',
      type: 'string',
    },

  },

  exits: {
    success: {
      description: 'All done.',
    },
  },

  fn: async function(inputs, exits) {

    // sails.log.info('************************* Telegram answerPreCheckoutQuery: ', inputs);

    try {

      // sails.log.warn('answerPreCheckoutQuery...');

      const answerPreCheckoutQueryResult = await sails.config.custom.telegramBot.answerPreCheckoutQuery(
        inputs.preCheckoutQuery.id || '',
        inputs.isOk,
        {
          error_message: inputs.errorMessage || '',
        }
        );

      // sails.log.warn(`answerPreCheckoutQueryResult:
      // ${JSON.stringify(answerPreCheckoutQueryResult, null, 3)}`);

      const paymentProviderAndEnv = sails.config.custom.config.payments.telegram.provider.toUpperCase() +
        '_' + sails.config.custom.config.payments.telegram.env.toUpperCase();

      if (_.isNil(inputs.preCheckoutQuery.invoice_payload)) {
        sails.log.error(`${moduleName}, error: no inputs.preCheckoutQuery.invoice_payload:
          ${JSON.stringify(inputs.preCheckoutQuery, null, 3)}`);
        throw new Error(`${moduleName}, error: no inputs.preCheckoutQuery.invoice_payload:
          ${JSON.stringify(inputs.preCheckoutQuery, null, 3)}`);
      }

      // const paymentId = inputs.preCheckoutQuery.invoice_payload;
      //
      //
      // //TODO: Заменить на метод storage.paymentGetJoi (нужно его создать)
      // const invoiceRec = await Payments.findOne({
      //   payment_id: paymentId,
      //   payment_status: sails.config.custom.enums.paymentStatus.INVOICE,
      // });
      //
      // if (invoiceRec == null) {
      //   sails.log.error(`${moduleName}, error: no invoice payment record found for ${paymentId}`);
      //   throw new Error(`${moduleName}, error: no invoice payment record found for ${paymentId}`);
      // }

      // const paymentGroupGuid = invoiceRec.paymentGroupGuid;
      const paymentGroupGuid = inputs.preCheckoutQuery.invoice_payload;

      if (answerPreCheckoutQueryResult) {

        await sails.helpers.storage.paymentCreateJoi({
          paymentGroupGuid,
          paymentStatus: sails.config.custom.enums.paymentStatus.CHECKOUT,
          paymentData: {
            preCheckoutQuery: inputs.preCheckoutQuery,
            isOk: inputs.isOk,
            errorMessage: inputs.errorMessage || '',
          },
          paymentResponse: answerPreCheckoutQueryResult,
          clientId: inputs.client.id,
          clientGuid: inputs.client.guid,
          accountGuid: inputs.client.account_use,
          amount: inputs.preCheckoutQuery.total_amount/100 || 0,
          currency: inputs.preCheckoutQuery.currency || 'XXX',
        });

        return exits.success({
          status: 'ok',
          message: sails.config.custom.ANSWER_PRE_CHECKOUT_QUERY_OK,
          payload: {},
        });
      } else {

        await sails.helpers.storage.paymentCreateJoi({
          paymentGroupGuid,
          paymentStatus: sails.config.custom.enums.paymentStatus.CHECKOUT_ERROR,
          paymentData: {
            preCheckoutQuery: inputs.preCheckoutQuery,
            isOk: inputs.isOk,
            errorMessage: inputs.errorMessage || '',
          },
          paymentResponse: answerPreCheckoutQueryResult,
          comments: 'answerPreCheckoutQueryResult return False',
          clientId: inputs.client.id,
          clientGuid: inputs.client.guid,
          accountGuid: inputs.client.account_use,
        });

        return exits.success({
          status: 'nok',
          message: sails.config.custom.ANSWER_PRE_CHECKOUT_QUERY_NOK,
          payload: {},
        });
      }



    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}, error: ${sails.config.custom.ANSWER_PRE_CHECKOUT_QUERY_ERROR}`;

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

  }

};

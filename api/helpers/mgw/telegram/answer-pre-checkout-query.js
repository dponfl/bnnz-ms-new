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

      const answerPreCheckoutQueryResult = await sails.config.custom.telegramBot.answerPreCheckoutQuery(
        inputs.preCheckoutQuery.id || '',
        inputs.isOk,
        {
          error_message: inputs.errorMessage || '',
        }
        );

      const paymentProviderAndEnv = sails.config.custom.config.payments.telegram.provider.toUpperCase() +
        '_' + sails.config.custom.config.payments.telegram.env.toUpperCase();

      if (answerPreCheckoutQueryResult) {

        await sails.helpers.storage.paymentCreate.with({
          paymentStatus: sails.config.custom.enums.paymentStatus.CHECKOUT,
          paymentData: {
            preCheckoutQuery: inputs.preCheckoutQuery,
            isOk: inputs.isOk,
            errorMessage: inputs.errorMessage || '',
          },
          paymentResponse: answerPreCheckoutQueryResult,
          paymentProvider: paymentProviderAndEnv,
          messenger: sails.config.custom.enums.messenger.TELEGRAM,
          clientId: inputs.client.id,
          clientGuid: inputs.client.guid,
        });

        return exits.success({
          status: 'ok',
          message: sails.config.custom.ANSWER_PRE_CHECKOUT_QUERY_OK,
          payload: {},
        });
      } else {

        await sails.helpers.storage.paymentCreate.with({
          paymentStatus: sails.config.custom.enums.paymentStatus.CHECKOUT_ERROR,
          paymentData: {
            preCheckoutQuery: inputs.preCheckoutQuery,
            isOk: inputs.isOk,
            errorMessage: inputs.errorMessage || '',
          },
          paymentResponse: answerPreCheckoutQueryResult,
          paymentProvider: paymentProviderAndEnv,
          messenger: sails.config.custom.enums.messenger.TELEGRAM,
          comments: 'answerPreCheckoutQueryResult return False',
          clientId: inputs.client.id,
          clientGuid: inputs.client.guid,
        });

        return exits.success({
          status: 'nok',
          message: sails.config.custom.ANSWER_PRE_CHECKOUT_QUERY_NOK,
          payload: {},
        });
      }



    } catch (e) {

      const errorLocation = 'api/helpers/mgw/telegram/answer-pre-checkout-query';
      const errorMsg = sails.config.custom.ANSWER_PRE_CHECKOUT_QUERY_ERROR;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
        }
      };

    }

  }

};

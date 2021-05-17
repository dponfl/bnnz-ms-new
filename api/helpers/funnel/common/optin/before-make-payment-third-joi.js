"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'api:helpers:funnel:common:optin:before-make-payment-third-joi';


module.exports = {


  friendlyName: 'api:helpers:funnel:common:optin:before-make-payment-third-joi',


  description: 'api:helpers:funnel:common:optin:before-make-payment-third-joi',


  inputs: {

    params: {
      friendlyName: 'input params',
      description: 'input params',
      type: 'ref',
      required: true,
    },

  },


  exits: {
    success: {
      description: 'All done.',
    },
    err: {
      description: 'Error',
    }
  },


  fn: async function (inputs, exits) {

    const schema = Joi.object({
      client: Joi
        .any()
        .description('Client record')
        .required(),
      block: Joi
        .any()
        .description('Current funnel block')
        .required(),
      payload: Joi
        .any()
        .description('{text, inline_keyboard, img, video, doc} object')
        .required(),
      msg: Joi
        .any()
        .description('Message received'),
    });

    let input;

    let client;
    let clientGuid;
    let accountGuid;


    try {

      input = await schema.validateAsync(inputs.params);

      client = input.client;
      clientGuid = client.guid;
      accountGuid = client.account_use;

      const currentAccount = _.find(client.accounts, {guid: accountGuid});

      const inlineKeyboard = [];

      const inlineKeyboardElem0 = input.payload.inline_keyboard[0];

      const paymentProviderEnv = process.env.PAYMENT_ENV.toUpperCase();

      const useLang = (_.has(sails.config.custom.config.lang, input.client.lang) ? input.client.lang : 'ru');

      const pool = [];

      for (const pp of sails.config.custom.config.payments.pool[paymentProviderEnv]) {

        pool.push({
          providerName: pp,
          providerTitle: sails.config.custom.config.lang[useLang].payments[pp.toUpperCase()].title,
        })

      }

      for (const p of pool) {

        const text = await MessageProcessor.parseStr({
          client,
          token: inlineKeyboardElem0[0].text,
          additionalTokens: [
            {
              token: '$PaymentProviderName$',
              value: p.providerTitle,
            },
          ],
        });

        /**
         * Получаем платёжный линк для соответствующего платёжного провайдера
         */

        const priceConfigText = sails.config.custom.config.lang[useLang].price;

        const priceConfigGeneral = sails.config.custom.config.price;

        const currentServiceName = currentAccount.service.name;

        const currentRegion = currentAccount.region;

        const amount = priceConfigGeneral[currentRegion][currentServiceName].period_01.current_price;

        const currency = priceConfigGeneral[currentRegion].currency;

        const description = await MessageProcessor.parseStr({
          client: input.client,
          token: "COMMON_MAKE_PAYMENT_PMT_DESCRIPTION",
          additionalTokens: [
            {
              token: "$paymentPeriod$",
              value: priceConfigText.payment_periods.period_01,
            }
          ]
        });

        const paymentProviderName = p.providerName;

        const paymentPeriod = sails.config.custom.enums.paymentPeriod.CURRENT;

        const paymentInterval = priceConfigGeneral.payment_periods.period_01.value;

        const paymentIntervalUnit = priceConfigGeneral.payment_periods.period_01.period;

        const serviceName = currentServiceName;

        const funnelBlockName = `optin::${input.block.id}`;

        const createdBy = moduleName;

        const getPaymentLinkParams = {
          client,
          paymentProviderName,
          paymentProviderEnv,
          amount,
          currency,
          description,
          paymentPeriod,
          paymentInterval,
          paymentIntervalUnit,
          serviceName,
          funnelBlockName,
          createdBy,
        }

        try {

          const getPaymentLinkRaw = await sails.helpers.payments[paymentProviderName].getPaymentLink(getPaymentLinkParams);

          if (
            _.isNil(getPaymentLinkRaw)
            || _.isNil(getPaymentLinkRaw.status)
            || getPaymentLinkRaw.status !== 'success'
            || _.isNil(getPaymentLinkRaw.payload)
            || _.isNil(getPaymentLinkRaw.payload.url)
          ) {
            await LogProcessor.critical({
              message: 'Wrong getPaymentLink response',
              clientGuid,
              accountGuid,
              // requestId: null,
              // childRequestId: null,
              errorName: sails.config.custom.GENERAL_ERROR.name,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
              location: moduleName,
              payload: {
                paymentProviderName,
                getPaymentLinkParams,
                getPaymentLinkRaw,
              },
            });
          }

          const url = getPaymentLinkRaw.payload.url;

          inlineKeyboard.push([{
            text,
            url,
          }]);

        } catch (err) {
          // No actions needed here because we already logged error above

          const throwError = false;
          if (throwError) {
            return await sails.helpers.general.catchErrorJoi({
              error: err,
              location: moduleName,
              throwError,
              errorPayloadAdditional: {
                clientGuid,
                accountGuid,
              },
            });
          } else {
            await sails.helpers.general.catchErrorJoi({
              error: err,
              location: moduleName,
              throwError,
              errorPayloadAdditional: {
                clientGuid,
                accountGuid,
              },
            });

            continue;
          }

        }

      }

      return exits.success({
        text: input.payload.text,
        inline_keyboard: inlineKeyboard,
      });

    } catch (e) {

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          clientGuid,
          accountGuid,
          error: e,
          location: moduleName,
          throwError,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          clientGuid,
          accountGuid,
          error: e,
          location: moduleName,
          throwError,
        });
        return exits.success({
          status: 'error',
          message: `${moduleName} not performed`,
          payload: {},
        });
      }

    }

  }

};


"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment');

const moduleName = 'funnel:silver-personal:optin:callback-make-payment-second-joi';


module.exports = {


  friendlyName: 'funnel:silver-personal:optin:callback-make-payment-second-joi',


  description: 'funnel:silver-personal:optin:callback-make-payment-second-joi',


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
      query: Joi
        .any()
        .description('Callback query received')
        .required(),
    });

    let input;

    let clientGuid;
    let accountGuid;

    let useLang;

    let priceConfigText;
    let priceConfigGeneral;

    let currentAccount;
    let currentRegion;

    let currentAmount;
    let currentCurrency;
    let currentCurrencyText;


    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});
      currentRegion = currentAccount.region;

      useLang = (_.has(sails.config.custom.config.lang, input.client.lang) ? input.client.lang : 'ru');

      priceConfigText = sails.config.custom.config.lang[useLang].price;
      priceConfigGeneral = sails.config.custom.config.price;

      if (priceConfigText == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'No text price config found (missing config.lang[useLang].price)',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR.name,
          payload: {
            useLang,
          },
        });
      }

      if (priceConfigGeneral == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'No text price config found (missing config.price)',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR.name,
          payload: {},
        });
      }

      currentAmount = priceConfigGeneral[currentRegion].silver_personal.period_01.current_price;
      currentCurrency = priceConfigGeneral[currentRegion].currency;
      currentCurrencyText = priceConfigText.currency[currentCurrency];


      switch (input.query.data) {
        case 'make_payment':

// TODO: Временная заглушка по причине нереботы тестовых платежей: Начало

          const currentAccountInd = _.findIndex(input.client.accounts, (o) => {
            return o.guid === currentAccount.guid;
          });

          /**
           * Обновляем поля записи текущего аккаунта
           */

          input.client.accounts[currentAccountInd].payment_made = true;
          input.client.accounts[currentAccountInd].subscription_from = moment()
            .format();
          input.client.accounts[currentAccountInd].subscription_until = moment()
            .add(priceConfigGeneral.payment_periods.period_01.value, priceConfigGeneral.payment_periods.period_01.period)
            .format();

          const reallocateRoomsToAccountJoiParams = {
            account: currentAccount,
          };

          const reallocateRoomsToAccountJoiRaw = await sails.helpers.general.reallocateRoomsToAccountJoi(reallocateRoomsToAccountJoiParams);

          if (reallocateRoomsToAccountJoiRaw.status !== 'ok') {
            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.ERROR,
              location: moduleName,
              message: 'Wrong reallocateRoomsToAccountJoi response',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.FUNNELS_ERROR.name,
              payload: {
                reallocateRoomsToAccountJoiParams,
                reallocateRoomsToAccountJoiRaw,
              },
            });
          }


          input.block.next = 'optin::payment_successful';

          /**
           * Устанавливае у следующего блока значение для предшествующего блока в 'optin::make_payment'
           */

          const splitRes = _.split(input.block.next, sails.config.custom.JUNCTION, 2);
          const updateFunnel = splitRes[0];
          const updateId = splitRes[1];


          const getBlock = _.find(input.client.funnels[updateFunnel], {id: updateId});

          if (getBlock) {
            getBlock.previous = 'optin::make_payment';
            getBlock.enabled = true;
          }

          /**
           * Создаём запись о получении платежа
           */


          const currency = currentCurrency;

          // const invoiceItems = [
          //   {
          //     quantity: '1.0',
          //     price: priceConfigGeneral[currentRegion].silver_personal.period_01.list_price,
          //   }
          // ];
          //
          // if (priceConfigGeneral[currentRegion].silver_personal.period_01.current_price !== priceConfigGeneral[currentRegion].silver_personal.period_01.list_price) {
          //   invoiceItems.push({
          //     quantity: '1.0',
          //     price: priceConfigGeneral[currentRegion].silver_personal.period_01.current_price - priceConfigGeneral[currentRegion].silver_personal.period_01.list_price,
          //   });
          // }

          const invoiceItems = [
            {
              quantity: '1.0',
              price: currentAmount,
            }
          ];

          const messenger = input.client.messenger;
          const clientId = input.client.id;
          const clientGuid = input.client.guid;
          const accountGuid = input.client.account_use;

          const paymentProvider = sails.config.custom.config.payments[messenger]['provider'].toUpperCase() +
            '_' + sails.config.custom.config.payments[messenger]['env'].toUpperCase();

          let invoiceAmount = 0;

          for (const elem of invoiceItems) {
            invoiceAmount = invoiceAmount + elem.price * elem.quantity;
          }

          const paymentGroupRecRaw = await sails.helpers.storage.paymentGroupCreateJoi({
            clientId,
            clientGuid,
            accountGuid,
            amount: invoiceAmount,
            currency,
            type: sails.config.custom.enums.paymentGroupType.DEPOSIT,
            status: sails.config.custom.enums.paymentGroupStatus.SUCCESS,
            paymentProvider,
            messenger,
            funnelBlockName: `optin::${input.block.id}`,
          });

          if (paymentGroupRecRaw.status !== 'ok') {
            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.ERROR,
              location: moduleName,
              message: 'Payment group record create error',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.FUNNELS_ERROR.name,
              payload: {
                paymentGroupRecRaw,
              },
            });
          }




// TODO: Временная заглушка по причине нереботы тестовых платежей: Окончание



          /**
           * Инициировать последовательность действий по оплате
           */

          // const paymentProvider = sails.config.custom.config.payments[input.client.messenger]['provider'].toLowerCase();
          //
          // if (paymentProvider == null) {
          //   // throw new Error(`${moduleName}, error: No payment provider config for messenger: ${input.client.messenger}`);
          //
          //   await sails.helpers.general.throwErrorJoi({
          //     errorType: sails.config.custom.enums.errorType.CRITICAL,
          //     emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          //     location: moduleName,
          //     message: 'No payment provider config for messenger',
          //     clientGuid,
          //     accountGuid,
          //     errorName: sails.config.custom.FUNNELS_ERROR.name,
          //     payload: {
          //       inputClientMessenger: input.client.messenger,
          //     },
          //   });
          //
          // }
          //
          //
          // const title = await MessageProcessor.parseStr({
          //   client: input.client,
          //   token: "COMMON_MAKE_PAYMENT_PMT_TITLE",
          //   additionalTokens: [
          //     {
          //       token: "$paymentPeriod$",
          //       value: priceConfigText.payment_periods.period_01,
          //     }
          //   ]
          // });
          //
          // const description = await MessageProcessor.parseStr({
          //   client: input.client,
          //   token: "COMMON_MAKE_PAYMENT_PMT_DESCRIPTION",
          //   additionalTokens: [
          //     {
          //       token: "$paymentPeriod$",
          //       value: priceConfigText.payment_periods.period_01,
          //     }
          //   ]
          // });
          //
          // const currency = currentCurrencyText;
          //
          // const item01Description = await MessageProcessor.parseStr({
          // client: input.client,
          // token: "COMMON_MAKE_PAYMENT_PMT_ITEM1_DESCRIPTION",
          //   additionalTokens: [
          //     {
          //       token: "$paymentPeriod$",
          //       value: priceConfigText.payment_periods.period_01,
          //     }
          //   ]
          // });
          //
          // const item02Description = await MessageProcessor.parseStr({
          // client: input.client,
          // token: "COMMON_MAKE_PAYMENT_PMT_ITEM2_DESCRIPTION",
          // });
//
// /*
//           const invoiceItems = [
//             {
//               description: item01Description,
//               quantity: '1.0',
//               price: priceConfigGeneral[currentRegion].silver_personal.period_01.list_price,
//               currency,
//               transform_to_min_price_unit: priceConfigGeneral[currentRegion].transform_to_min_price_unit,
//             }
//           ];
//
//           if (priceConfigGeneral[currentRegion].silver_personal.period_01.current_price !== priceConfigGeneral[currentRegion].silver_personal.period_01.list_price) {
//             invoiceItems.push({
//               description: item02Description,
//               quantity: '1.0',
//               price: priceConfigGeneral[currentRegion].silver_personal.period_01.current_price - priceConfigGeneral[currentRegion].silver_personal.period_01.list_price,
//               currency,
//               transform_to_min_price_unit: priceConfigGeneral[currentRegion].transform_to_min_price_unit,
//             });
//           }
// */
//
//           const invoiceItems = [
//             {
//               description: item01Description,
//               quantity: '1.0',
//               price: currentAmount,
//               currency,
//               transform_to_min_price_unit: priceConfigGeneral[currentRegion].transform_to_min_price_unit,
//             }
//           ];
//
//
          // const sendInvoiceResultRaw = await sails.helpers.pgw[paymentProvider]['sendInvoiceJoi']({
          //   client: input.client,
          //   title,
          //   description,
          //   startParameter: 'start',
          //   currency,
          //   invoiceItems,
          //   funnelBlockName: `optin::${input.block.id}`,
          // });
          //
          // if (sendInvoiceResultRaw.status !== 'ok') {
          //   // throw new Error(`${moduleName}, error: sendInvoice error response:
          //   // ${JSON.stringify(sendInvoiceResultRaw, null, 3)}`);
          //
          //   await sails.helpers.general.throwErrorJoi({
          //     errorType: sails.config.custom.enums.errorType.ERROR,
          //     location: moduleName,
          //     message: 'Wrong sendInvoice response',
          //     clientGuid,
          //     accountGuid,
          //     errorName: sails.config.custom.FUNNELS_ERROR.name,
          //     payload: {
          //       sendInvoiceResultRaw,
          //     },
          //   });
          //
          // }
          //
          // const accountIndex = _.findIndex(input.client.accounts, {guid: input.client.account_use});
          //
          // if (accountIndex < 0) {
          //   // throw new Error(`${moduleName}, error: account not found:
          //   // client.account_use: ${input.client.account_use}
          //   // client.accounts: ${JSON.stringify(input.client.accounts, null, 3)}`);
          //
          //   await sails.helpers.general.throwErrorJoi({
          //     errorType: sails.config.custom.enums.errorType.ERROR,
          //     location: moduleName,
          //     message: 'account not found',
          //     clientGuid,
          //     accountGuid,
          //     errorName: sails.config.custom.FUNNELS_ERROR.name,
          //     payload: {
          //       account_use: input.client.account_use,
          //       accounts: input.client.accounts,
          //     },
          //   });
          //
          // }
          //
          // input.client.accounts[accountIndex].payment_amount = currentAmount;
          // input.client.accounts[accountIndex].payment_currency = currency;

          break;
        default:
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Wrong callback data',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.FUNNELS_ERROR.name,
            payload: {
              inputQueryData: input.query.data,
            },
          });

      }

      input.block.done = true;

      await sails.helpers.funnel.afterHelperGenericJoi({
        client: input.client,
        block: input.block,
        msg: input.query,
        next: true,
        previous: true,
        switchFunnel: true,
        createdBy: moduleName,
      });

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      })

    } catch (e) {

      // const errorLocation = moduleName;
      // const errorMsg = `${moduleName}: General error`;
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
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
          },
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
          },
        });
        return exits.success({
          status: 'ok',
          message: `${moduleName} performed`,
          payload: {},
        });
      }

    }

  }

};


"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment');

const moduleName = 'funnel:silver-personal:optin:callback-make-payment-third-joi';


module.exports = {


  friendlyName: 'funnel:silver-personal:optin:callback-make-payment-third-joi',


  description: 'funnel:silver-personal:optin:callback-make-payment-third-joi',


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

    try {

      input = await schema.validateAsync(inputs.params);

      switch (input.query.data) {
        case 'make_payment':

// TODO: Временная заглушка по причине нереботы тестовых платежей: Начало

          const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});
          const currentAccountInd = _.findIndex(input.client.accounts, (o) => {
            return o.guid === currentAccount.guid;
          });

          /**
           * Обновляем поля записи текущего аккаунта
           */

          const priceConfig = sails.config.custom.config.price;

          input.client.accounts[currentAccountInd].payment_made = true;
          input.client.accounts[currentAccountInd].subscription_from = moment()
            .format();
          input.client.accounts[currentAccountInd].subscription_until = moment()
            .add(priceConfig.payment_periods.period_01.value, priceConfig.payment_periods.period_01.period)
            .format();

          const reallocateRoomsToAccountJoiParams = {
            account: currentAccount,
          };

          const reallocateRoomsToAccountJoiRaw = await sails.helpers.general.reallocateRoomsToAccountJoi(reallocateRoomsToAccountJoiParams);

          if (reallocateRoomsToAccountJoiRaw.status !== 'ok') {
            throw new Error(`${moduleName}, error: wrong reallocateRoomsToAccountJoi response:
        reallocateRoomsToAccountJoiParams: ${JSON.stringify(reallocateRoomsToAccountJoiParams, null, 3)}
        reallocateRoomsToAccountJoiRaw: ${JSON.stringify(reallocateRoomsToAccountJoiRaw, null, 3)}`);
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

          const priceConfigGeneral = sails.config.custom.config.price;
          const currency = 'RUB';
          const invoiceItems = [
            {
              quantity: '1.0',
              price: priceConfigGeneral[currency].silver_personal.period_01.list_price,
            }
          ];

          if (priceConfigGeneral[currency].silver_personal.period_01.current_price !== priceConfigGeneral[currency].silver_personal.period_01.list_price) {
            invoiceItems.push({
              quantity: '1.0',
              price: priceConfigGeneral[currency].silver_personal.period_01.current_price - priceConfigGeneral[currency].silver_personal.period_01.list_price,
            });
          }

          const messenger = input.client.messenger;
          const clientId = input.client.id;
          const clientGuid = input.client.guid;
          const accountGuid = input.client.account_use;

          const paymentProvider = sails.config.custom.config.payments[messenger]['provider'].toUpperCase() +
            '_' + sails.config.custom.config.payments[messenger]['env'].toUpperCase();

          let invoiceAmount = 0;

          for (const elem of input.invoiceItems) {
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
            throw new Error(`${moduleName}, error: payment group record create error:
            ${JSON.stringify(paymentGroupRecRaw, null, 3)}`);
          }




// TODO: Временная заглушка по причине нереботы тестовых платежей: Окончание


          /**
           * Инициировать последовательность действий по оплате
           */

          // const paymentProvider = sails.config.custom.config.payments[input.client.messenger]['provider'].toLowerCase();
          //
          // if (paymentProvider == null) {
          //   throw new Error(`${moduleName}, error: No payment provider config for messenger: ${input.client.messenger}`);
          // }
          //
          // const useLang = (_.has(sails.config.custom.config.lang, input.client.lang) ? input.client.lang : 'ru');
          //
          // const priceConfigText = sails.config.custom.config.lang[useLang].price;
          // const priceConfigGeneral = sails.config.custom.config.price;
          //
          // if (priceConfigText == null) {
          //   throw new Error(`${moduleName}, error: No text price config found: ${JSON.stringify(sails.config.custom.config.lang[useLang].price, null, 3)}`);
          // }
          //
          // if (priceConfigGeneral == null) {
          //   throw new Error(`${moduleName}, error: No general price config found: ${JSON.stringify(sails.config.custom.config.price, null, 3)}`);
          // }
          //
          // const title = MessageProcessor.parseStr({
          //   client: input.client,
          //   token: "BEHERO_MAKE_PAYMENT_PMT_TITLE",
          //   additionalTokens: [
          //     {
          //       token: "$paymentPeriod$",
          //       value: priceConfigText.payment_periods.period_01,
          //     }
          //   ]
          // });
          //
          // const description = MessageProcessor.parseStr({
          //   client: input.client,
          //   token: "BEHERO_MAKE_PAYMENT_PMT_DESCRIPTION",
          //   additionalTokens: [
          //     {
          //       token: "$paymentPeriod$",
          //       value: priceConfigText.payment_periods.period_01,
          //     }
          //   ]
          // });
          //
          // const currency = 'RUB';
          //
          // const item01Description = MessageProcessor.parseStr({
          // client: input.client,
          // token: "BEHERO_MAKE_PAYMENT_PMT_ITEM1_DESCRIPTION",
          //   additionalTokens: [
          //     {
          //       token: "$paymentPeriod$",
          //       value: priceConfigText.payment_periods.period_01,
          //     }
          //   ]
          // });
          //
          // const item02Description = MessageProcessor.parseStr({
          // client: input.client,
          // token: "BEHERO_MAKE_PAYMENT_PMT_ITEM2_DESCRIPTION",
          // });
          //
          // const invoiceItems = [
          //   {
          //     description: item01Description,
          //     quantity: '1.0',
          //     price: priceConfigGeneral[currency].silver_personal.period_01.list_price,
          //     currency,
          //     transform_to_min_price_unit: priceConfigGeneral[currency].transform_to_min_price_unit,
          //   }
          // ];
          //
          // if (priceConfigGeneral[currency].silver_personal.period_01.current_price !== priceConfigGeneral[currency].silver_personal.period_01.list_price) {
          //   invoiceItems.push({
          //     description: item02Description,
          //     quantity: '1.0',
          //     price: priceConfigGeneral[currency].silver_personal.period_01.current_price - priceConfigGeneral[currency].silver_personal.period_01.list_price,
          //     currency,
          //     transform_to_min_price_unit: priceConfigGeneral[currency].transform_to_min_price_unit,
          //   });
          // }
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
          //   throw new Error(`${moduleName}, error: sendInvoice error response:
          //   ${JSON.stringify(sendInvoiceResultRaw, null, 3)}`);
          // }
          //
          // const accountIndex = _.findIndex(input.client.accounts, {guid: input.client.account_use});
          //
          // if (accountIndex < 0) {
          //   throw new Error(`${moduleName}, error: account not found:
          //   client.account_use: ${input.client.account_use}
          //   client.accounts: ${JSON.stringify(input.client.accounts, null, 3)}`);
          // }
          //
          // input.client.accounts[accountIndex].payment_amount = priceConfigGeneral[currency].silver_personal.period_01.current_price;
          // input.client.accounts[accountIndex].payment_currency = currency;

          break;
        default:
          throw new Error(`${moduleName}, error: Wrong callback data: ${input.query.data}`);
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

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

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


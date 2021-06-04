"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment');

const moduleName = 'api:helpers:payments:on-payment-success';


module.exports = {


  friendlyName: 'api:helpers:payments:on-payment-success',


  description: 'api:helpers:payments:on-payment-success',


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
      amount: Joi
        .number()
        .positive()
        .description('payment amount')
        .required(),
      orderId: Joi
        .string()
        .description('PG id')
        .required(),
      clientGuid: Joi
        .string()
        .description('client guid')
        .guid()
        .required(),
      accountGuid: Joi
        .string()
        .description('account guid')
        .guid()
        .required(),
      paymentGroupGuid: Joi
        .string()
        .description('paymentGroup guid')
        .guid()
        .required(),
    });

    let input;

    let client;
    let account;
    let clientGuid;
    let accountGuid;


    try {

      input = await schema.validateAsync(inputs.params);

      // TODO: Delete after QA
      await LogProcessor.info({
        message: 'onPaymentSuccess helper',
        location: moduleName,
        payload: {
          input,
        },
      });


      clientGuid = input.clientGuid;
      accountGuid = input.accountGuid;

      const amount = input.amount;
      const orderId = input.orderId;
      const paymentGroupGuid = input.paymentGroupGuid;

      /**
       * Действия:
       *
       *  - получаем запись клиента (включая его аккаунты) и аккаунт по accountGuid
       *
       *  - из paymentGroup получаем данные:
       *    - clientGuid
       *    - accountGuid
       *    - период оплаты (текущий или последующий)
       *    - категория оплаченного сервиса
       *    - срок оплаченного сервиса
       *    - блок воронки, в котором была инициирована оплата
       *
       *
       *  - для paymentGroup обновляем поля:
       *    - status
       *
       *
       *  - для случая "период оплаты = такущий":
       *    - обновляем поля записи аккаунта, по которому получен платёж:
       *      - payment_made
       *      - payment_amount
       *      - payment_currency
       *      - service
       *      - subscription_from
       *      - subscription_until
       *      - serviceNameToPay = null
       *      - activeGtGuid = null
       *      - paymentLink = null
       *    - прописываем аккаунт в комнаты
       *
       *  - для случая "период оплаты = последующий":
       *    - обновляем поля записи аккаунта, по которому получен платёж:
       *      - next_subscription_from
       *      - next_subscription_until
       *      - next_payment_plan
       *      - next_payment_made
       *      - serviceNameToPay = null
       *      - activeGtGuid = null
       *      - paymentLink = null
       *
       *
       *  - вызов "...onPaymentSuccessJoi" callback-хелпера блок воронки, в котором была инициирована оплата
       */



      /**
       * Получаем запись клиента (включая его аккаунты) и аккаунт по accountGuid
       */

      const clientRaw = await sails.helpers.storage.clientGetByCriteriaJoi({
        criteria: {
          guid: clientGuid,
        }
      });

      if (clientRaw.status !== 'ok') {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: 'client not found by guid',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            clientGuid,
            clientRaw,
          },
        });
      }
      if (clientRaw.payload.length !== 1) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: 'several or none client records found by guid',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            clientGuid,
            clientRaw,
          },
        });
      }

      client = clientRaw.payload[0];

      account = _.find(client.accounts, {guid: accountGuid});
      const accountInd = _.findIndex(client.accounts, (o) => {
        return o.guid === account.guid;
      });


      /**
       * Получаем данные из paymentGroup
       */

      const paymentGroupRaw = await sails.helpers.storage.paymentGroupGetJoi({
        criteria: {
          guid: paymentGroupGuid,
        }
      });

      if (paymentGroupRaw.status !== 'ok') {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: 'payment group not found by guid',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            paymentGroupGuid,
            paymentGroupRaw,
          },
        });
      }
      if (paymentGroupRaw.payload.length !== 1) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: 'several or none payment group records found by guid',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            paymentGroupGuid,
            paymentGroupRaw,
          },
        });
      }

      const paymentGroup = paymentGroupRaw.payload[0];

      if (paymentGroup.client_guid !== clientGuid) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: 'Discrepancy of client guid',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            clientGuid,
            paymentGroup,
          },
        });
      }

      if (paymentGroup.account_guid !== accountGuid) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: 'Discrepancy of account guid',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            accountGuid,
            paymentGroup,
          },
        });
      }

      if (paymentGroup.amount !== Number(amount)) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: 'Discrepancy of amount',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            amount,
            paymentGroup,
          },
        });
      }

      if (paymentGroup.id !== Number(orderId)) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: 'Discrepancy of orderId',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            orderId,
            paymentGroup,
          },
        });
      }

      const paymentPeriod = paymentGroup.paymentPeriod;

      const serviceName = paymentGroup.serviceName;

      const paymentInterval = paymentGroup.paymentInterval;

      const paymentIntervalUnit = paymentGroup.paymentIntervalUnit;

      const funnelBlock = paymentGroup.funnel_block;

      /**
       * Обновляем статус paymentGroup
       */

      const paymentGroupUpdateParams = {
        criteria: {
          guid: paymentGroupGuid,
        },
        data: {
          status: sails.config.custom.enums.paymentGroupStatus.SUCCESS,
        },
        createdBy: moduleName,
      }

      const paymentGroupUpdateRaw = await sails.helpers.storage.paymentGroupUpdateJoi(paymentGroupUpdateParams);

      if (paymentGroupUpdateRaw.status !== 'ok') {
        await LogProcessor.critical({
          message: 'paymentGroup status not updated',
          clientGuid,
          accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          payload: {
            paymentGroupUpdateParams,
            paymentGroupUpdateRaw,
          },
        });
      }

      switch (paymentPeriod) {
        case sails.config.custom.enums.paymentPeriod.CURRENT:

          await proceedCurrentPayment(
            client,
            account,
            serviceName,
            paymentGroup.amount,
            paymentGroup.currency,
            paymentInterval,
            paymentIntervalUnit
          );

          break;
        case sails.config.custom.enums.paymentPeriod.NEXT:

          await proceedNextPayment(
            client,
            account,
            serviceName,
            paymentGroup.amount,
            paymentGroup.currency,
            paymentInterval,
            paymentIntervalUnit
          );

          break;

        default:
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
            location: moduleName,
            message: 'Invalid paymentPeriod value',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.GENERAL_ERROR.name,
            payload: {
              paymentPeriod,
            },
          });
      }

      /**
       * Используя наименование сервиса, воронки, блока и коллбэк-хелпера - формируем обращение
       * к хелперу, который должен обрабатывать результат успешного платежа
       */

      const blockNameParseRes = _.split(funnelBlock, sails.config.custom.JUNCTION, 2);
      const blockGroup = blockNameParseRes[0];
      const blockId = blockNameParseRes[1];

      if (_.isNil(blockGroup)
        || _.isNil(blockId)
      ) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: 'Block parsing error',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            block: funnelBlock,
            blockGroup,
            blockId,
          },
        });
      }

      const block = _.find(client.funnels[blockGroup], {id: blockId});

      if (_.isNil(block)) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: 'Block not found',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            blockGroup,
            blockId,
            funnel: client.funnels[blockGroup],
          },
        });
      }

      const helperNameRaw = block.callbackHelper;

      const callbackHelperParseRes = _.split(helperNameRaw, sails.config.custom.JUNCTION, 3);
      const callbackHelperCategory = callbackHelperParseRes[0];
      const callbackHelperGroup = callbackHelperParseRes[1];
      const callbackHelperName = callbackHelperParseRes[2];

      if (
        _.isNil(callbackHelperCategory)
        || _.isNil(callbackHelperGroup)
        || _.isNil(callbackHelperName)
      ) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: 'Block parsing error',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            helperNameRaw,
            callbackHelperParseRes,
            callbackHelperCategory,
            callbackHelperGroup,
            callbackHelperName,
          },
        });
      }

      const successHelperName = `${callbackHelperName}OnPaymentSuccessJoi`;

      /**
       * Вызываем хелпер обработки успешного платежа
       */

      await sails.helpers.funnel[callbackHelperCategory][callbackHelperGroup][successHelperName]({
        client,
        block,
        paymentGroup,
      });


      return exits.success({
        status: 'success',
        message: `${moduleName} performed`,
        payload: {},
      })

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

async function proceedCurrentPayment(
  client,
  account,
  serviceName,
  amount,
  currency,
  paymentInterval,
  paymentIntervalUnit
) {

  const methodName = 'proceedCurrentPayment';

  let previousServiceName = null;

  account.payment_made = true;
  account.payment_amount = amount;
  account.payment_currency = currency;
  account.subscription_from = moment().format();
  account.subscription_until = moment()
    .add(paymentInterval, paymentIntervalUnit)
    .format();
  account.serviceNameToPay = null;
  account.activeGtGuid = null;
  account.paymentLink = null;

  const getServiceRes = await sails.helpers.storage.getService.with({serviceName});

  if (_.isNil(getServiceRes.status)
    || getServiceRes.status !== 'ok'
    || _.isNil(getServiceRes.payload)
  ) {
    await sails.helpers.general.throwErrorJoi({
      errorType: sails.config.custom.enums.errorType.CRITICAL,
      emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
      location: moduleName,
      message: 'Unexpected getService response',
      clientGuid: client.guid,
      accountGuid: account.guid,
      errorName: sails.config.custom.STORAGE_ERROR.name,
      payload: {
        serviceName,
        getServiceRes,
      },
    });
  }

  if (!_.isNil(account.service.name)) {
    previousServiceName = account.service.name;
  }

  account.service = getServiceRes.payload;

  /**
   * Прописываем аккаунт в комнаты
   */

  const reallocateRoomsToAccountJoiParams = {
    account,
    previousServiceName,
  };

  const reallocateRoomsToAccountJoiRaw = await sails.helpers.general.reallocateRoomsToAccountJoi(reallocateRoomsToAccountJoiParams);

  if (reallocateRoomsToAccountJoiRaw.status !== 'ok') {
    await sails.helpers.general.throwErrorJoi({
      errorType: sails.config.custom.enums.errorType.ERROR,
      location: `${moduleName} => ${methodName}`,
      message: 'Wrong reallocateRoomsToAccountJoi response',
      clientGuid: client.guid,
      accountGuid: account.guid,
      errorName: sails.config.custom.FUNNELS_ERROR.name,
      payload: {
        reallocateRoomsToAccountJoiParams,
        reallocateRoomsToAccountJoiRaw,
      },
    });
  }

  /**
   * Обновляем данные по аккаунту в БД
   */

  const accountUpdateParams = {
    criteria: {
      guid: account.guid,
    },
    data: {
      service: account.service.id,
      payment_made: account.payment_made,
      payment_amount: account.payment_amount,
      payment_currency: account.payment_currency,
      subscription_from: account.subscription_from,
      subscription_until: account.subscription_until,
      serviceNameToPay: account.serviceNameToPay,
      activeGtGuid: account.activeGtGuid,
      paymentLink: account.paymentLink,
    },
    createdBy: `${moduleName} => ${methodName}`,
  }

  await sails.helpers.storage.accountUpdateJoi(accountUpdateParams);

}

async function proceedNextPayment(
  client,
  account,
  nextPaymentPlan,
  amount,
  currency,
  paymentInterval,
  paymentIntervalUnit
) {

  const methodName = 'proceedNextPayment';

  account.next_payment_made = true;
  account.next_payment_plan = nextPaymentPlan;
  account.next_subscription_from = account.subscription_until;
  account.next_subscription_until = moment(account.subscription_until)
    .add(paymentInterval, paymentIntervalUnit)
    .format();
  account.serviceNameToPay = null;
  account.activeGtGuid = null;
  account.paymentLink = null;

  /**
   * Обновляем данные по аккаунту в БД
   */

  const accountUpdateParams = {
    criteria: {
      guid: account.guid,
    },
    data: {
      next_payment_made: account.next_payment_made,
      next_payment_plan: account.next_payment_plan,
      next_subscription_from: account.next_subscription_from,
      next_subscription_until: account.next_subscription_until,
      serviceNameToPay: account.serviceNameToPay,
      activeGtGuid: account.activeGtGuid,
      paymentLink: account.paymentLink,
    },
    createdBy: `${moduleName} => ${methodName}`,
  }

  await sails.helpers.storage.accountUpdateJoi(accountUpdateParams);

}


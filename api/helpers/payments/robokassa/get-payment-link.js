"use strict";

const Joi = require('@hapi/joi');
const rp = require('request-promise');
const errors = require('request-promise/errors');
const moment = require('moment');

const moduleName = 'api:helpers:payments:robokassa:get-payment-link';


module.exports = {


  friendlyName: 'api:helpers:payments:robokassa:get-payment-link',


  description: 'api:helpers:payments:robokassa:get-payment-link',


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
        .object()
        .description('Client record')
        .required(),
      paymentProviderName: Joi
        .string()
        .description('payment provider name')
        .valid('robokassa')
        .required(),
      paymentProviderEnv: Joi
        .string()
        .description('payment provider environment')
        .valid('PROD', 'UAT', 'DEV')
        .required(),
      amount: Joi
        .number()
        .description('payment amount')
        .required(),
      currency: Joi
        .string()
        .description('payment currency')
        .required(),
      description: Joi
        .string()
        .description('payment description')
        .required(),
      paymentPeriod: Joi
        .string()
        .description('payment period (e.g. "current" or "next")')
        .valid(
          sails.config.custom.enums.paymentPeriod.CURRENT,
          sails.config.custom.enums.paymentPeriod.NEXT,
        )
        .required(),
      paymentInterval: Joi
        .number()
        .integer()
        .positive()
        .description('payment interval (e.g. number of months')
        .required(),
      paymentIntervalUnit: Joi
        .string()
        .description('payment interval unit, e.g. "month"')
        .required(),
      serviceName: Joi
        .string()
        .description('name of service to be paid')
        .valid(
          sails.config.custom.enums.serviceNames.bronzePersonal,
          sails.config.custom.enums.serviceNames.silverPersonal,
          sails.config.custom.enums.serviceNames.goldPersonal,
          sails.config.custom.enums.serviceNames.platinumPersonal,
          sails.config.custom.enums.serviceNames.bronzeCommercial,
          sails.config.custom.enums.serviceNames.silverCommercial,
          sails.config.custom.enums.serviceNames.goldCommercial,
          sails.config.custom.enums.serviceNames.platinumCommercial,
        )
        .required(),
      funnelBlockName: Joi
        .string()
        .description('block name full')
        .required(),
      createdBy: Joi
        .string()
        .description('source of update')
        .required(),
    });

    let input;

    let client;
    let clientId;
    let clientGuid;
    let accountGuid;
    let currentAccount;

    let paymentProvider;
    let paymentProviderName;
    let paymentProviderEnv;

    let amount;
    let currency;
    let description;
    let paymentPeriod;
    let paymentInterval;
    let paymentIntervalUnit;
    let serviceName;
    let funnelBlockName;

    let requestError = null;

    try {

      input = await schema.validateAsync(inputs.params);

      client = input.client;

      clientId = client.id;
      clientGuid = client.guid;
      accountGuid = client.account_use;

      paymentProviderName = input.paymentProviderName.toUpperCase();
      paymentProviderEnv = input.paymentProviderEnv.toUpperCase();
      paymentProvider = `${paymentProviderName}_${paymentProviderEnv}`;

      amount = input.amount;
      currency = input.currency;
      description = input.description;
      paymentPeriod = input.paymentPeriod;
      paymentInterval = input.paymentInterval;
      paymentIntervalUnit = input.paymentIntervalUnit;
      serviceName = input.serviceName;
      funnelBlockName = input.funnelBlockName;

      const accountGetParams = {
        accountGuids: [accountGuid],
      }

      const accountRaw = await sails.helpers.storage.accountGetJoi(accountGetParams);

      if (
        _.isNil(accountRaw)
        || _.isNil(accountRaw.status)
        || accountRaw.status !== 'ok'
        || _.isNil(accountRaw.payload)
      ) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: 'Wrong accountGetJoi reply',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            accountGetParams,
            accountRaw,
          },
        });
      }

      if (
        !_.isArray(accountRaw.payload)
        || accountRaw.payload.length !== 1
      ) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: 'Wrong accountGetJoi response: payload',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            accountGetParams,
            accountRaw,
          },
        });
      }

      currentAccount = accountRaw.payload[0];

      const currentAccountInd = _.findIndex(input.client.accounts, (o) => {
        return o.guid === currentAccount.guid;
      });

      if (
        !_.isNil(currentAccount.serviceNameToPay)
        && !_.isNil(currentAccount.activeGtGuid)
        && !_.isNil(currentAccount.paymentLink)
        && currentAccount.serviceNameToPay === serviceName
      ) {

        /**
         * Запись "account" содержит валидные данные для использования
         */

        return exits.success({
          status: 'success',
          message: `${moduleName} performed`,
          payload: {
            url: currentAccount.paymentLink,
          },
        })

      }

      /**
       * Если есть неоплаченная PG,
       * но клиент всё же хочет оплатить другую категорию сервиса,
       * то необходимо обновить запись неоплаченной PG
       */

      if (
        !_.isNil(currentAccount.serviceNameToPay)
        && !_.isNil(currentAccount.activeGtGuid)
        && !_.isNil(currentAccount.paymentLink)
        && currentAccount.serviceNameToPay !== serviceName
      ) {

        const paymentGroupUpdateParams = {
          criteria: {
            guid: currentAccount.activeGtGuid
          },
          data: {
            status: sails.config.custom.enums.paymentGroupStatus.DECLINED,
          },
          createdBy: moduleName,
        }

        const paymentGroupUpdateRaw = await sails.helpers.storage.paymentGroupUpdateJoi(paymentGroupUpdateParams);

        if (
          paymentGroupUpdateRaw.status !== 'ok'
        ) {
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
            location: moduleName,
            message: 'Payment group record update error',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.GENERAL_ERROR.name,
            payload: {
              paymentGroupUpdateParams,
              paymentGroupUpdateRaw,
            },
          });
        }

      }

      /**
       * Создаём записи в таблицах платежей
       */

      const paymentGroupRecCreateParams = {
        clientId,
        clientGuid,
        accountGuid,
        serviceName,
        amount,
        currency,
        paymentPeriod,
        paymentInterval,
        paymentIntervalUnit,
        type: sails.config.custom.enums.paymentGroupType.DEPOSIT,
        status: sails.config.custom.enums.paymentGroupStatus.PROCESSING,
        paymentProvider,
        messenger: client.messenger,
        funnelBlockName,
      }

      const paymentGroupRecRaw = await sails.helpers.storage.paymentGroupCreateJoi(paymentGroupRecCreateParams);

      if (
        paymentGroupRecRaw.status !== 'ok'
        || _.isNil(paymentGroupRecRaw.payload)
      ) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: 'Payment group record create error',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            paymentGroupRecCreateParams,
            paymentGroupRecRaw,
          },
        });
      }

      const paymentGroupRec = paymentGroupRecRaw.payload;


      /**
       * Делаем запрос на получение платёжного линка
       */

      const platform = 'Payment MS';
      const action = 'getPaymentLink';
      const api = paymentProvider;
      const requestType = 'payment';
      let status = '';

      const momentStart = moment();

      const baseUrl = sails.config.custom.enums.paymentProviderApi[paymentProviderEnv][paymentProviderName]['baseUrl'];
      const apiName = sails.config.custom.enums.paymentProviderApi[paymentProviderEnv][paymentProviderName]['name']
      const apiAction = sails.config.custom.enums.paymentProviderApi[paymentProviderEnv][paymentProviderName]['actions']['payment'];

      const hashData = {
        amount,
        orderId: paymentGroupRec.id,
        cid: client.guid,
        aid: currentAccount.guid,
        gtid: paymentGroupRec.guid,
      };

      const signature = await sails.helpers.security.calculateHash({
        data: hashData,
      });

      const requestParams = {
        signature,
        amount,
        description,
        orderId: paymentGroupRec.id,
        cid: client.guid,
        aid: currentAccount.guid,
        gtid: paymentGroupRec.guid,
        isTest: paymentProviderEnv === 'DEV',
      }

      const options = {
        method: 'POST',
        uri: `${baseUrl}/${apiName}/${apiAction}`,
        body: requestParams,
        json: true,
      };

      const requestRes = await rp(options)
        .catch(errors.StatusCodeError, async (reason) => {
          // The server responded with a status codes other than 2xx.
          // Check reason.statusCode

          const momentDone = moment();
          const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

          let performanceCreateParams;

          status = 'error';
          await LogProcessor.error({
            message: sails.config.custom.HTTP_REQUEST_STATUS_CODE_ERROR.message,
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.HTTP_REQUEST_STATUS_CODE_ERROR.name,
            location: moduleName,
            payload: reason,
          });

          performanceCreateParams = {
            platform,
            action,
            api,
            requestType,
            requestDuration,
            status,
            clientGuid,
            accountGuid,
            comments: reason,
          };

          await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

          requestError = {
            status: 'error',
            subStatus: 'StatusCodeError',
            message: `${moduleName} performed with error`,
            payload: reason,
          };

        })
        .catch(errors.RequestError, async (reason) => {
          // The request failed due to technical reasons.
          // reason.cause is the Error object Request would pass into a callback.

          status = 'error';
          const momentDone = moment();
          const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

          await LogProcessor.error({
            message: sails.config.custom.HTTP_REQUEST_ERROR.message,
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.HTTP_REQUEST_ERROR.name,
            location: moduleName,
            payload: reason,
          });

          const performanceCreateParams = {
            platform,
            action,
            api,
            requestType,
            requestDuration,
            status,
            clientGuid,
            accountGuid,
            comments: reason,
          };

          await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

          requestError = {
            status: 'error',
            subStatus: 'RequestError',
            message: `${moduleName} performed with error`,
            payload: {
              name: reason.name,
              message: reason.message,
              cause: reason.cause,
            },
          };

        });

      if (requestError) {
        return exits.success(requestError);
      }

      if (
        _.isNil(requestRes.status)
        || requestRes.status !== 'success'
      ) {

        status = 'error';
        const momentDone = moment();

        const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

        await LogProcessor.error({
          message: sails.config.custom.HTTP_REQUEST_WRONG_RESPONSE_STATUS.message,
          clientGuid,
          accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.HTTP_REQUEST_WRONG_RESPONSE_STATUS.name,
          location: moduleName,
          payload: {
            requestParams: options,
            rawResponse: requestRes,
          },
        });

        const performanceCreateParams = {
          platform,
          action,
          api,
          requestType,
          requestDuration,
          status,
          clientGuid,
          accountGuid,
          comments: {
            requestParams: options,
            rawResponse: requestRes,
          },
        };

        await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

        return exits.success({
          status: 'error',
          subStatus: 'WrongResponseStatus',
          message: `${moduleName} performed with error`,
          payload: {
            error: 'wrong response status',
          },
          raw: requestRes,
        })

      }

      if (
        _.isNil(requestRes.url)
      ) {

        status = 'error';
        const momentDone = moment();

        const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

        await LogProcessor.error({
          message: sails.config.custom.HTTP_REQUEST_WRONG_RESPONSE_DATA.message,
          clientGuid,
          accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.HTTP_REQUEST_WRONG_RESPONSE_DATA.name,
          location: moduleName,
          payload: {
            requestParams: options,
            rawResponse: requestRes,
          },
        });

        const performanceCreateParams = {
          platform,
          action,
          api,
          requestType,
          requestDuration,
          status,
          clientGuid,
          accountGuid,
          comments: {
            requestParams: options,
            rawResponse: requestRes,
          },
        };

        await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

        return exits.success({
          status: 'error',
          subStatus: 'WrongResponseData',
          message: `${moduleName} performed with error`,
          payload: {
            error: 'response has no "url" key',
          },
          raw: requestRes,
        })

      }

      const url = requestRes.url;

      status = 'success';

      const momentDone = moment();

      const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

      const performanceCreateParams = {
        platform,
        action,
        api,
        requestType,
        requestDuration,
        status,
        clientGuid,
        accountGuid,
        comments: {
          requestParams: options,
          rawResponse: requestRes,
        },
      };

      await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);


      /**
       * Обновляем данные записи в "account"
       */

      currentAccount.serviceNameToPay = serviceName;
      currentAccount.activeGtGuid = paymentGroupRec.guid;
      currentAccount.paymentLink = url;

      client.accounts[currentAccountInd] = currentAccount;

      await sails.helpers.storage.clientUpdateJoi({
        criteria: {guid: client.guid},
        data: client,
        createdBy: `${input.createdBy} => ${moduleName}`,
      });

      return exits.success({
        status: 'success',
        message: `${moduleName} performed`,
        payload: {
          url,
        },
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


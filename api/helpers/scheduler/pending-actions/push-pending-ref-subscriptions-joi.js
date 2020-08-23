"use strict";

const Joi = require('@hapi/joi');
const sleep = require('util').promisify(setTimeout);
const moment = require('moment');


const moduleName = 'scheduler:pending-actions:push-pending-ref-subscriptions-joi';


module.exports = {


  friendlyName: 'scheduler:pending-actions:push-pending-ref-subscriptions-joi',


  description: 'scheduler:pending-actions:push-pending-ref-subscriptions-joi',


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


  fn: async function (inputs, exits) {

    let clientGuid;
    let accountGuid;

    try {

      /**
       * Получаем список записей, которые нужно обработать
       */

      const getPendingRefSubscriptionsParams = {
        criteria: {
          pendingActionName: sails.config.custom.enums.pendingActionsNames.REF_PROFILES_SUBSCRIPTION,
          done: false,
          deleted: false,
        }
      };

      const pendingRefSubscriptionsRaw = await sails.helpers.storage.pendingActionsGetJoi(getPendingRefSubscriptionsParams);

      if (pendingRefSubscriptionsRaw.status !== 'ok') {

        await LogProcessor.error({
          message: 'Wrong "pendingActionsGetJoi" response: status',
          // clientGuid,
          // accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.SCHEDULER_ERROR.name,
          location: moduleName,
          payload: {
            getPendingRefSubscriptionsParams,
            pendingRefSubscriptionsRaw,
          },
        });

        return exits.success({
          status: 'error',
          message: `${moduleName} performed`,
          payload: {},
        })

      }
      
      const pendingRefSubscriptions = _.get(pendingRefSubscriptionsRaw, 'payload', null);

      if (pendingRefSubscriptions == null) {

        await LogProcessor.error({
          message: 'Wrong "pendingActionsGetJoi" response: payload',
          // clientGuid,
          // accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.SCHEDULER_ERROR.name,
          location: moduleName,
          payload: {
            getPendingRefSubscriptionsParams,
            pendingRefSubscriptionsRaw,
          },
        });

        return exits.success({
          status: 'error',
          message: `${moduleName} performed`,
          payload: {},
        })

      }

      _.forEach(pendingRefSubscriptions, async (pendingRefSubscription) => {

        /**
         * Для коммуникации выбираем клиентов, у которых account_use == pendingRefSubscription.accountGuid
         */

        const clientGetParams = {

          criteria: {
            guid: pendingRefSubscription.clientGuid,
            account_use: pendingRefSubscription.accountGuid
          }

        };

        const clientsGetRaw = await sails.helpers.storage.clientGetByCriteriaJoi(clientGetParams);

        if (clientsGetRaw.status !== 'ok') {

          await LogProcessor.error({
            message: 'Wrong "clientGetByCriteriaJoi" response: status',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.SCHEDULER_ERROR.name,
            location: moduleName,
            payload: {
              clientGetParams,
              clientsGetRaw,
            },
          });

          return exits.success({
            status: 'error',
            message: `${moduleName} performed`,
            payload: {},
          })

        }

        const clients = _.get(clientsGetRaw, 'payload', null);

        if (clients == null) {

          await LogProcessor.error({
            message: 'Wrong "clientGetByCriteriaJoi" response: payload',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.SCHEDULER_ERROR.name,
            location: moduleName,
            payload: {
              clientGetParams,
              clientsGetRaw,
            },
          });

          return exits.success({
            status: 'error',
            message: `${moduleName} performed`,
            payload: {},
          })

        }

        if (clients.length > 1) {

          await LogProcessor.error({
            message: 'Wrong "clientGetByCriteriaJoi" response: more then one record found',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.SCHEDULER_ERROR.name,
            location: moduleName,
            payload: {
              clientGetParams,
              clientsGetRaw,
            },
          });

          return exits.success({
            status: 'error',
            message: `${moduleName} performed`,
            payload: {},
          })

        }

        const client = clients[0];
        const account = _.find(client.accounts, {guid: client.account_use});

        clientGuid = client.guid;
        accountGuid = account.guid;

        await processPendingRefSubscription(client, account, pendingRefSubscription);

      });


      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      })

    } catch (e) {

      const throwError = false;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
          }
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
          }
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

async function processPendingRefSubscription(client, account, pendingSubscription) {

  let clientGuid;
  let accountGuid;

  let checkProfileSubscriptionResRaw;
  let parserStatus = '';
  const parserRequestIntervals = sails.config.custom.config.parsers.inst.errorSteps.checkRefSubscription.intervals;
  const parserRequestIntervalTime = sails.config.custom.config.parsers.inst.errorSteps.intervalTime;


  try {

    clientGuid = client.guid;
    accountGuid = account.guid;

    if (_.get(pendingSubscription, 'payloadResponse.allSubscribed', false)) {

      /**
       * Подписка на все профили уже выполнена. Обновляем запись и выходим.
       */

      await sails.helpers.storage.pendingActionsUpdateJoi({
        criteria: {
          guid: pendingSubscription.guid,
        },
        data: {
          done: true,
        }
      });

      return true;

    }

    /**
     * В этом случае нужно проверить подписку парсером
     */

    const profilesList = _.get(pendingSubscription, 'payload.profiles', null);

    if (profilesList == null) {

      /**
       * По какой-то причине в записи pendingSubscription нет списка профилей
       */

      await sails.helpers.general.throwErrorJoi({
        errorType: sails.config.custom.enums.errorType.ERROR,
        location: moduleName,
        message: 'No "payload.profiles" at pendingSubscription',
        clientGuid,
        accountGuid,
        errorName: sails.config.custom.SCHEDULER_ERROR.name,
        payload: {
          pendingSubscription,
        },
      });

    }

    const activeParser = sails.config.custom.config.parsers.inst.activeParserName;

    const checkProfileSubscriptionParams = {
      checkProfile: account.inst_profile,
      profileId: account.inst_id,
      profilesList,
    };

    let i = 0;

    const momentStart = moment();

    while (parserStatus !== 'success'
      && i < parserRequestIntervals.length
    ) {

      checkProfileSubscriptionResRaw = await sails.helpers.parsers.inst[activeParser].checkProfileSubscriptionJoi(checkProfileSubscriptionParams);

      parserStatus = checkProfileSubscriptionResRaw.status;

      if (parserStatus !== 'success') {

        /**
         * Логируем факт факапа парсера с фиксацией текущего интервала
         */

        const momentNow = moment();

        const requestDuration = moment.duration(momentNow.diff(momentStart)).asMilliseconds();

        /**
         * Логируем ошибку парсера
         */

        await LogProcessor.error({
          message: sails.config.custom.INST_PARSER_CHECK_PROFILE_EXISTS_ERROR.message,
          clientGuid,
          accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.INST_PARSER_CHECK_PROFILE_EXISTS_ERROR.name,
          location: moduleName,
          payload: {
            parserRequestInterval: parserRequestIntervals[i],
            requestDuration,
          },
        });

        await sleep(parserRequestIntervals[i] * parserRequestIntervalTime);

      }

      i++;

    }

    if (parserStatus !== 'success') {

      /**
       * Корректный ответ от парсера так и НЕ БЫЛ ПОЛУЧЕН
       */

      /**
       * Обновляем запись для последующей обработки её шедуллером
       */

      pendingSubscription.actionsPerformed++;

      await sails.helpers.storage.pendingActionsUpdateJoi({
        criteria: {
          guid: pendingSubscription.guid,
        },
        data: {
          actionsPerformed: pendingSubscription.actionsPerformed,
        }
      });

      return true;

    } else {

      /**
       * Корректный ответ от парсера БЫЛ ПОЛУЧЕН
       */

      const checkProfileSubscriptionRes = _.get(checkProfileSubscriptionResRaw, 'payload', null);

      if (checkProfileSubscriptionRes == null) {

        /**
         * По какой-то причине в checkProfileSubscriptionResRaw нет payload
         */

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'No "payload" at checkProfileSubscriptionResRaw',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.SCHEDULER_ERROR.name,
          payload: {
            checkProfileSubscriptionResRaw,
          },
        });

      }

      /**
       * Сохраняем результат проверки в pendingSubscription и соответствующей записи
       */

      pendingSubscription.payloadResponse = checkProfileSubscriptionRes;

      await sails.helpers.storage.pendingActionsUpdateJoi({
        criteria: {
          guid: pendingSubscription.guid,
        },
        data: {
          payloadResponse: pendingSubscription.payloadResponse,
        }
      });

      if (_.toString(account.keyboard) === '') {

        /**
         * Клиент находится в какой-то воронке (нужно немного подождать и попробовать снова)
         */

        const sleepInterval = _.get(sails.config.custom.config, 'schedule.intervals.processPendingRefSubscription', null);

        if (sleepInterval == null) {

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'No "schedule.intervals.processPendingRefSubscription" at config',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.SCHEDULER_ERROR.name,
            payload: {
              configSchedule: sails.config.custom.config.schedule.intervals,
            },
          });

        }

        await sleep(sleepInterval);

        const getAccountRaw = await sails.helpers.storage.accountGetJoi({
          accountGuids: account.guid,
        });

        if (getAccountRaw.status !== 'ok') {

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'Wrong accountGetJoi response: status',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.SCHEDULER_ERROR.name,
            payload: {
              accountGuids: account.guid,
              getAccountRaw,
            },
          });

        }

        if (getAccountRaw.payload.length > 1) {

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'Wrong accountGetJoi response: payload length > 1',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.SCHEDULER_ERROR.name,
            payload: {
              accountGuids: account.guid,
              getAccountRaw,
            },
          });

        }

        account = getAccountRaw.payload[0];

        if (_.toString(account.keyboard) === '') {

          /**
           * Клиент по прежнему находится в воронке - выходим
           */

          return true;

        }

      }

      /**
       * Клиент находится в какой-то клавиатуре без активный действий
       */

      if (_.get(pendingSubscription, 'payloadResponse.allSubscribed', false)) {

        /**
         * Подписка на все требуемые профили ВЫПОЛНЕНА
         */



      }

    }

    return true;

  } catch (e) {

    const throwError = false;
    if (throwError) {
      return await sails.helpers.general.catchErrorJoi({
        error: e,
        location: moduleName,
        throwError: true,
        errorPayloadAdditional: {
          clientGuid,
          accountGuid,
          pendingSubscription,
        }
      });
    } else {
      await sails.helpers.general.catchErrorJoi({
        error: e,
        location: moduleName,
        throwError: false,
        errorPayloadAdditional: {
          clientGuid,
          accountGuid,
          pendingSubscription,
        }
      });
      return exits.success({
        status: 'error',
        message: `${moduleName} performed`,
        payload: {},
      });
    }

  }

}


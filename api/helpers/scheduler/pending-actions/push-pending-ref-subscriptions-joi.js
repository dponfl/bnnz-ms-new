"use strict";

const Joi = require('@hapi/joi');

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
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      });
    }

  }

}


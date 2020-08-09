"use strict";

const moduleName = 'general:push-pending-onboarding';


module.exports = {


  friendlyName: 'general:push-pending-onboarding',


  description: 'Find account with pending onboarding and push its processing',


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


    try {

      await LogProcessor.info({
        message: 'Checking pending onboarding accounts',
        location: moduleName,
      });

      const accountGetParams = {
        otherConditions: {
          service_subscription_finalized: false,
        },
      };

      const pendingAccountsRaw = await sails.helpers.storage.accountGetJoi(accountGetParams);

      if (pendingAccountsRaw.status != null && pendingAccountsRaw.status === 'ok') {

        const pendingAccounts = pendingAccountsRaw.payload;

        if (pendingAccounts.length > 0) {
          await LogProcessor.warn({
            message: 'Pending onboarding accounts found',
            location: moduleName,
            payload: {
              numberOfPendingAccounts: pendingAccounts.length,
              accounts: pendingAccounts,
            },
          });
        } else {
          await LogProcessor.warn({
            message: 'Pending onboarding accounts NOT FOUND',
            location: moduleName,
          });
        }

        /**
         * Выполнение прохода по пендинг аккаунтам последовательно
         */

        // for (const account of pendingAccounts) {
        //
        //   const clientGetByCriteriaParams = {
        //     criteria: {
        //       id: account.client,
        //     }
        //   };
        //
        //   const clientRaw = await sails.helpers.storage.clientGetByCriteriaJoi(clientGetByCriteriaParams);
        //
        //   if (clientRaw.status != null && clientRaw.status === 'ok') {
        //
        //     const clientArray = clientRaw.payload;
        //
        //     if (clientArray.length === 0) {
        //       // TODO: Выполнить логирование ошибки, что отсутствует клиентская запись для аккаунта
        //     } else if (clientArray.length > 1) {
        //       // TODO: Выполнить логирование ошибки, что существует больше одной клиентской записи
        //     } else {
        //
        //       const client = clientArray[0];
        //
        //       /**
        //        * Онбординг не завершен - толкаем выполнение текущей воронки
        //        */
        //
        //       const initialBlock = _.find(client.funnels[client.current_funnel],
        //         {initial: true});
        //
        //       await sails.helpers.funnel.proceedNextBlockJoi({
        //         client,
        //         funnelName: client.current_funnel,
        //         blockId: initialBlock.id,
        //         createdBy: moduleName,
        //         throwError: false,
        //       });
        //
        //     }
        //
        //   }
        //
        // }

        /**
         * Выполнение прохода по пендинг аккаунтам асинхронно
         */

        _.forEach(pendingAccounts, async (account) => {

          const clientGetByCriteriaParams = {
            criteria: {
              id: account.client,
            }
          };

          const clientRaw = await sails.helpers.storage.clientGetByCriteriaJoi(clientGetByCriteriaParams);

          if (clientRaw.status != null && clientRaw.status === 'ok') {

            const clientArray = clientRaw.payload;

            if (clientArray.length === 0) {
              // TODO: Выполнить логирование ошибки, что отсутствует клиентская запись для аккаунта
            } else if (clientArray.length > 1) {
              // TODO: Выполнить логирование ошибки, что существует больше одной клиентской записи
            } else {

              const client = clientArray[0];

              /**
               * Онбординг не завершен - толкаем выполнение текущей воронки
               */

              const initialBlock = _.find(client.funnels[client.current_funnel],
                {initial: true});

              await sails.helpers.funnel.proceedNextBlockJoi({
                client,
                funnelName: client.current_funnel,
                blockId: initialBlock.id,
                createdBy: moduleName,
                throwError: false,
              });

            }

          }

        });

      }


      // return exits.success({
      //   status: 'ok',
      //   message: `${moduleName} performed`,
      //   payload: {},
      // })

    } catch (e) {

      // const errorMsg = 'General error';
      //
      // sails.log.error(`${moduleName}, Error details:
      // Platform error message: ${errorMsg}
      // Error name: ${e.name || 'no name'}
      // Error message: ${e.message || 'no message'}
      // Error stack: ${JSON.stringify(e.stack || {}, null, 3)}`);
      //
      // throw {err: {
      //     module: `${moduleName}`,
      //     message: errorMsg,
      //     payload: {
      //       error_name: e.name || 'no name',
      //       error_message: e.message || 'no message',
      //       error_stack: e.stack || {},
      //     },
      //   }
      // };

      await sails.helpers.general.catchErrorJoi({
        error: e,
        location: moduleName,
        throwError: false,
      });
      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      });

    }

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


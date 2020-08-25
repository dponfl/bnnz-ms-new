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

      if (pendingRefSubscriptions.length > 0) {

        // TODO: Delete after QA
        await LogProcessor.info({
          message: 'Найдены записи для отложенной проверки подписки',
          // clientGuid,
          // accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.SCHEDULER_ERROR.name,
          location: moduleName,
          payload: {
            pendingRefSubscriptions,
          },
        });

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

          // TODO: Delete after QA
          await LogProcessor.info({
            message: 'запискаем процесс обработки кейса',
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.SCHEDULER_ERROR.name,
            location: moduleName,
            payload: {
              pendingRefSubscription
            },
          });

          await processPendingRefSubscription(client, account, pendingRefSubscription);

        });


      }


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
       * Подписка на все профили уже выполнена. Информируем клиента, обновляем запись и выходим.
       */

      // TODO: Delete after QA
      // await LogProcessor.info({
      //   message: 'Подписка на все профили уже выполнена. Обновляем запись и выходим',
      //   clientGuid,
      //   accountGuid,
      //   // requestId: null,
      //   // childRequestId: null,
      //   errorName: sails.config.custom.SCHEDULER_ERROR.name,
      //   location: moduleName,
      //   payload: {
      //     pendingSubscription,
      //   },
      // });

      if (_.toString(account.keyboard) === '') {

        /**
         * Клиент находится в какой-то воронке (нужно немного подождать и попробовать снова)
         */

        // TODO: Delete after QA
        await LogProcessor.info({
          message: 'Подписка на все профили уже выполнена, но клиент находится в какой-то воронке (нужно немного подождать и попробовать снова)',
          clientGuid,
          accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.SCHEDULER_ERROR.name,
          location: moduleName,
          payload: {
            account,
          },
        });


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

          // TODO: Delete after QA
          await LogProcessor.info({
            message: 'Клиент по прежнему находится в воронке - выходим',
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.SCHEDULER_ERROR.name,
            location: moduleName,
            payload: {
              account,
            },
          });


          return true;

        }

      }


      // TODO: Delete after QA
      await LogProcessor.info({
        message: 'Подписка на все требуемые профили уже ВЫПОЛНЕНА: информируем клиента, обновляем запись и выходим',
        clientGuid,
        accountGuid,
        // requestId: null,
        // childRequestId: null,
        errorName: sails.config.custom.SCHEDULER_ERROR.name,
        location: moduleName,
        payload: {
          pendingSubscription,
        },
      });


      const msgRes = await sails.helpers.messageProcessor.sendMessageJoi({
        client,
        messageData: sails.config.custom.pushMessages.scheduler.refProfileSubscriptionCheck.joinRefDone,
      });

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

    // TODO: Delete after QA
    await LogProcessor.info({
      message: 'В этом случае нужно проверить подписку парсером',
      clientGuid,
      accountGuid,
      // requestId: null,
      // childRequestId: null,
      errorName: sails.config.custom.SCHEDULER_ERROR.name,
      location: moduleName,
      payload: {
        pendingSubscription,
      },
    });



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
      client,
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

      // TODO: Delete after QA
      await LogProcessor.info({
        message: 'Корректный ответ от парсера так и НЕ БЫЛ ПОЛУЧЕН',
        clientGuid,
        accountGuid,
        // requestId: null,
        // childRequestId: null,
        errorName: sails.config.custom.SCHEDULER_ERROR.name,
        location: moduleName,
        payload: {
          checkProfileSubscriptionResRaw,
        },
      });


      /**
       * Обновляем запись для последующей обработки её шедуллером
       */

      // TODO: Delete after QA
      await LogProcessor.info({
        message: 'Обновляем запись для последующей обработки её шедуллером',
        clientGuid,
        accountGuid,
        // requestId: null,
        // childRequestId: null,
        errorName: sails.config.custom.SCHEDULER_ERROR.name,
        location: moduleName,
        payload: {
          pendingSubscription,
        },
      });

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

      // TODO: Delete after QA
      await LogProcessor.info({
        message: 'Корректный ответ от парсера БЫЛ ПОЛУЧЕН',
        clientGuid,
        accountGuid,
        // requestId: null,
        // childRequestId: null,
        errorName: sails.config.custom.SCHEDULER_ERROR.name,
        location: moduleName,
        payload: {
          checkProfileSubscriptionResRaw,
        },
      });


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

      // TODO: Delete after QA
      await LogProcessor.info({
        message: 'Сохраняем результат проверки в pendingSubscription и соответствующей записи',
        clientGuid,
        accountGuid,
        // requestId: null,
        // childRequestId: null,
        errorName: sails.config.custom.SCHEDULER_ERROR.name,
        location: moduleName,
        payload: {
          checkProfileSubscriptionRes,
          pendingSubscription,
        },
      });


      pendingSubscription.payloadResponse = checkProfileSubscriptionRes;

      await sails.helpers.storage.pendingActionsUpdateJoi({
        criteria: {
          guid: pendingSubscription.guid,
        },
        data: {
          payloadResponse: pendingSubscription.payloadResponse,
        }
      });

      /**
       * устанавливаем в RefUp статус signed для аккаунтов профилей, на которые осуществлена подписка
       */

      if (checkProfileSubscriptionRes.subscribed.length > 0) {

        const signedAccountGuid = [];

        _.forEach(checkProfileSubscriptionRes.subscribed, (profile) => {

          const refListRec = _.find(pendingSubscription.payload.listProfilesAndAccountGuids, {profile: profile});

          if (refListRec) {
            signedAccountGuid.push(refListRec.accountGuid);
          }

        });

        await sails.helpers.storage.refUpUpdateJoi({
          criteria: {
            account_guid: accountGuid,
            ref_account_guid: signedAccountGuid,
          },
          data: {
            signed: true,
          },
          createdBy: moduleName,
        });

      }

      if (_.toString(account.keyboard) === '') {

        /**
         * Клиент находится в какой-то воронке (нужно немного подождать и попробовать снова)
         */

        // TODO: Delete after QA
        await LogProcessor.info({
          message: 'Клиент находится в какой-то воронке (нужно немного подождать и попробовать снова)',
          clientGuid,
          accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.SCHEDULER_ERROR.name,
          location: moduleName,
          payload: {
            account,
          },
        });


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

          // TODO: Delete after QA
          await LogProcessor.info({
            message: 'Клиент по прежнему находится в воронке - выходим',
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.SCHEDULER_ERROR.name,
            location: moduleName,
            payload: {
              account,
            },
          });


          return true;

        }

      }

      /**
       * Клиент находится в какой-то клавиатуре без активный действий
       */

      // TODO: Delete after QA
      await LogProcessor.info({
        message: 'Клиент находится в какой-то клавиатуре без активный действий',
        clientGuid,
        accountGuid,
        // requestId: null,
        // childRequestId: null,
        errorName: sails.config.custom.SCHEDULER_ERROR.name,
        location: moduleName,
        payload: {
          account,
          pendingSubscription,
        },
      });


      if (!_.has(pendingSubscription, 'payloadResponse.allSubscribed')) {

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'No "payloadResponse.allSubscribed" at pendingSubscription',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.SCHEDULER_ERROR.name,
          payload: {
            pendingSubscription,
          },
        });

      }

      if (pendingSubscription.payloadResponse.allSubscribed) {

        /**
         * Подписка на все требуемые профили ВЫПОЛНЕНА
         */

        // TODO: Delete after QA
        await LogProcessor.info({
          message: 'Подписка на все требуемые профили ВЫПОЛНЕНА',
          clientGuid,
          accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.SCHEDULER_ERROR.name,
          location: moduleName,
          payload: {
            pendingSubscription,
          },
        });


        const msgRes = await sails.helpers.messageProcessor.sendMessageJoi({
          client,
          messageData: sails.config.custom.pushMessages.scheduler.refProfileSubscriptionCheck.joinRefDone,
        });

        await sails.helpers.storage.pendingActionsUpdateJoi({
          criteria: {
            guid: pendingSubscription.guid,
          },
          data: {
            done: true,
          }
        });

        // account.keyboard = 'home::start';
        //
        // await sails.helpers.storage.clientUpdateJoi({
        //   criteria: {guid: client.guid},
        //   data: client,
        //   createdBy: moduleName,
        // });
        //
        // const sendKeyboardForAccountParams = {
        //   client,
        // };
        //
        // const sendKeyboardForAccountRaw = await sails.helpers.keyboardProcessor.sendKeyboardForAccountJoi(sendKeyboardForAccountParams);
        //
        // if (sendKeyboardForAccountRaw.status !== 'ok') {
        //
        //   await sails.helpers.general.throwErrorJoi({
        //     errorType: sails.config.custom.enums.errorType.ERROR,
        //     location: moduleName,
        //     message: 'Wrong sendKeyboardForAccountJoi response',
        //     clientGuid,
        //     accountGuid,
        //     errorName: sails.config.custom.SCHEDULER_ERROR.name,
        //     payload: {
        //       sendKeyboardForAccountParams,
        //       sendKeyboardForAccountRaw,
        //     },
        //   });
        //
        // }

      } else {

        /**
         * Подписка на все требуемые профили НЕ ВЫПОЛНЕНА
         */

        // TODO: Delete after QA
        await LogProcessor.info({
          message: 'Подписка на все требуемые профили НЕ ВЫПОЛНЕНА',
          clientGuid,
          accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.SCHEDULER_ERROR.name,
          location: moduleName,
          payload: {
            pendingSubscription,
          },
        });


        account.keyboard = 'refProfileSubscriptionCheck::start';

        await sails.helpers.storage.clientUpdateJoi({
          criteria: {guid: client.guid},
          data: client,
          createdBy: moduleName,
        });

        const sendKeyboardForAccountParams = {
          client,
        };

        const sendKeyboardForAccountRaw = await sails.helpers.keyboardProcessor.sendKeyboardForAccountJoi(sendKeyboardForAccountParams);

        if (sendKeyboardForAccountRaw.status !== 'ok') {

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'Wrong sendKeyboardForAccountJoi response',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.SCHEDULER_ERROR.name,
            payload: {
              sendKeyboardForAccountParams,
              sendKeyboardForAccountRaw,
            },
          });

        }

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


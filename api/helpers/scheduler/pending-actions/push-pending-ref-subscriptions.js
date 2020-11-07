"use strict";

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
       * Используем DB lock
       */

      const lockTimeOut = sails.config.custom.config.db.lockTimeOut || 600;

      const sqlGetLockPushPendingRefSubs = `
    SELECT GET_LOCK('pushPendingRefSubsLock', ${lockTimeOut}) as getPushPendingRefSubsLockResult
    `;

      const sqlReleaseLockPushPendingRefSubs = `
    SELECT RELEASE_LOCK('pushPendingRefSubsLock') as releasePushPendingRefSubsLockResult
    `;

      await sails.getDatastore('clientDb')
        .leaseConnection(async (db) => {

          try {

            const resGetLock = await sails
              .sendNativeQuery(sqlGetLockPushPendingRefSubs)
              .usingConnection(db);

            const getLockRes = _.get(resGetLock, 'rows[0].getPushPendingRefSubsLockResult', null);

            if (getLockRes == null) {
              await sails.helpers.general.throwErrorJoi({
                errorType: sails.config.custom.enums.errorType.CRITICAL,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                location: moduleName,
                message: sails.config.custom.DB_ERROR_GET_LOCK_WRONG_RESPONSE.message,
                errorName: sails.config.custom.DB_ERROR_GET_LOCK_WRONG_RESPONSE.name,
                payload: {
                  resGetLock,
                },
              });
            }

            if (getLockRes === 0) {
              await sails.helpers.general.throwErrorJoi({
                errorType: sails.config.custom.enums.errorType.CRITICAL,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                location: moduleName,
                message: sails.config.custom.DB_ERROR_GET_LOCK_DECLINE.message,
                errorName: sails.config.custom.DB_ERROR_GET_LOCK_DECLINE.name,
                payload: {
                  resGetLock,
                },
              });
            }

            /**
             * Получаем список записей, которые нужно обработать
             */

            const limit = _.find(sails.config.custom.config.schedule.rules, {action: "pushPendingRefSubscriptions"}).getRecordsLimit || 1000;

            const getPendingRefSubscriptionsParams = {
              criteria: {
                pendingActionName: sails.config.custom.enums.pendingActionsNames.REF_PROFILES_SUBSCRIPTION,
                checkInProgress: false,
                done: false,
                deleted: false,
              },
              limit,
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
                  limit,
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
                  message: 'запускаем процесс обработки кейса',
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

            const ReleaseLock = await sails
              .sendNativeQuery(sqlReleaseLockPushPendingRefSubs)
              .usingConnection(db);

            const releaseLockRes = _.get(ReleaseLock, 'rows[0].releasePushPendingRefSubsLockResult', null);

            if (releaseLockRes == null) {
              await LogProcessor.critical({
                message: sails.config.custom.DB_ERROR_RELEASE_LOCK_WRONG_RESPONSE.message,
                // clientGuid,
                // accountGuid,
                // requestId: null,
                // childRequestId: null,
                errorName: sails.config.custom.DB_ERROR_RELEASE_LOCK_WRONG_RESPONSE.name,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                location: moduleName,
                payload: {
                  releaseLockRes,
                },
              });
            }

            if (releaseLockRes === 0) {
              await LogProcessor.critical({
                message: sails.config.custom.DB_ERROR_RELEASE_LOCK_DECLINE.message,
                // clientGuid,
                // accountGuid,
                // requestId: null,
                // childRequestId: null,
                errorName: sails.config.custom.DB_ERROR_RELEASE_LOCK_DECLINE.name,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                location: moduleName,
                payload: {
                  releaseLockRes,
                },
              });
            }

            return;

          } catch (ee) {

            const ReleaseLock = await sails
              .sendNativeQuery(sqlReleaseLockPushPendingRefSubs)
              .usingConnection(db);

            const releaseLockRes = _.get(ReleaseLock, 'rows[0].releasePushPendingRefSubsLockResult', null);

            if (releaseLockRes == null) {
              await LogProcessor.critical({
                message: sails.config.custom.DB_ERROR_RELEASE_LOCK_WRONG_RESPONSE.message,
                // clientGuid,
                // accountGuid,
                // requestId: null,
                // childRequestId: null,
                errorName: sails.config.custom.DB_ERROR_RELEASE_LOCK_WRONG_RESPONSE.name,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                location: moduleName,
                payload: {
                  releaseLockRes,
                },
              });
            }

            if (releaseLockRes === 0) {
              await LogProcessor.critical({
                message: sails.config.custom.DB_ERROR_RELEASE_LOCK_DECLINE.message,
                // clientGuid,
                // accountGuid,
                // requestId: null,
                // childRequestId: null,
                errorName: sails.config.custom.DB_ERROR_RELEASE_LOCK_DECLINE.name,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                location: moduleName,
                payload: {
                  releaseLockRes,
                },
              });
            }

            const throwError = true;
            if (throwError) {
              return await sails.helpers.general.catchErrorJoi({
                error: ee,
                location: moduleName,
                throwError: true,
              });
            } else {
              await sails.helpers.general.catchErrorJoi({
                error: ee,
                location: moduleName,
                throwError: false,
              });
              return exits.success({
                status: 'ok',
                message: `${moduleName} performed`,
                payload: {},
              });
            }

          }

        }); // .leaseConnection()


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
        });
      } else {
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

    }

  }

};

async function processPendingRefSubscription(client, account, pendingSubscription) {

  let clientGuid;
  let accountGuid;

  let accountUpdated;

  let checkProfileSubscriptionParams;

  let checkProfileSubscriptionResRaw;
  let parserStatus = '';
  const parserRequestIntervals = sails.config.custom.config.parsers.inst.errorSteps.checkRefSubscription.intervals;
  const parserRequestIntervalTime = sails.config.custom.config.parsers.inst.errorSteps.intervalTime;

  let activeParser = null;
  const parserPlatformName = 'instagram';
  const parserModuleName = 'checkProfileSubscription';

  let pushMessage;


  try {

    clientGuid = client.guid;
    accountGuid = account.guid;

    const currentAccount = account;

    /**
     * Устанавливаем флаг, что запись взята в работу
     */

    pendingSubscription.actionsPerformed++;

    await sails.helpers.storage.pendingActionsUpdateJoi({
      criteria: {
        guid: pendingSubscription.guid,
      },
      data: {
        actionsPerformed: pendingSubscription.actionsPerformed,
        checkInProgress: true,
      }
    });


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

          /**
           * Устанавливаем флаг, что запись не находится в обработке
           */

          await sails.helpers.storage.pendingActionsUpdateJoi({
            criteria: {
              guid: pendingSubscription.guid,
            },
            data: {
              checkInProgress: false,
            }
          });

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

          /**
           * Устанавливаем флаг, что запись не находится в обработке
           */

          await sails.helpers.storage.pendingActionsUpdateJoi({
            criteria: {
              guid: pendingSubscription.guid,
            },
            data: {
              checkInProgress: false,
            }
          });

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

          /**
           * Устанавливаем флаг, что запись не находится в обработке
           */

          await sails.helpers.storage.pendingActionsUpdateJoi({
            criteria: {
              guid: pendingSubscription.guid,
            },
            data: {
              checkInProgress: false,
            }
          });

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

        accountUpdated = getAccountRaw.payload[0];

        if (_.toString(accountUpdated.keyboard) === '') {

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
              accountUpdated,
            },
          });

          /**
           * Устанавливаем флаг, что запись не находится в обработке
           */

          await sails.helpers.storage.pendingActionsUpdateJoi({
            criteria: {
              guid: pendingSubscription.guid,
            },
            data: {
              checkInProgress: false,
            }
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

      /**
       * Достаём данные PushMessage
       */

      const pushMessageName = currentAccount.service.push_message_name;

      const pushMessageGetParams = {
        pushMessageName,
      };

      const pushMessageGetRaw = await sails.helpers.storage.pushMessageGetJoi(pushMessageGetParams);

      if (pushMessageGetRaw.status !== 'ok') {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Wrong pushMessageGetJoi response',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.STORAGE_ERROR.name,
          payload: {
            pushMessageGetParams,
            pushMessageGetRaw,
          },
        });

      }

      pushMessage = pushMessageGetRaw.payload;

      const messageDataPath = 'scheduler.refProfileSubscriptionCheck.joinRefDone';
      const messageData = _.get(pushMessage, messageDataPath, null);

      if (messageData == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'No expected messageData',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.STORAGE_ERROR.name,
          payload: {
            pushMessage,
            messageDataPath,
            messageData,
          },
        });
      }

      const msgRes = await sails.helpers.messageProcessor.sendMessageJoi({
        client,
        messageData,
      });

      await sails.helpers.storage.pendingActionsUpdateJoi({
        criteria: {
          guid: pendingSubscription.guid,
        },
        data: {
          done: true,
          checkInProgress: false,
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

      /**
       * Устанавливаем флаг, что запись не находится в обработке
       */

      await sails.helpers.storage.pendingActionsUpdateJoi({
        criteria: {
          guid: pendingSubscription.guid,
        },
        data: {
          checkInProgress: false,
        }
      });

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

    /**
     * Получаем имя парсера
     */

    const getParserParams = {
      platformName: parserPlatformName,
      moduleName: parserModuleName,
    };

    activeParser = await sails.helpers.parsers.getParserJoi(getParserParams);

    checkProfileSubscriptionParams = {
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

      if (activeParser != null) {

        checkProfileSubscriptionResRaw = await sails.helpers.parsers.inst[activeParser].checkProfileSubscriptionJoi(checkProfileSubscriptionParams);

        parserStatus = checkProfileSubscriptionResRaw.status;

      } else {

        parserStatus = 'error';

      }


      if (parserStatus !== 'success') {

        if (activeParser != null) {

          /**
           * выставляем флаг, что парсер неактивен
           */

          const apiStatusUpdateParams = {
            platformName: parserPlatformName,
            moduleName: parserModuleName,
            parserName: activeParser,
            data: {
              key: 'active',
              value: false,
            },
            createdBy: moduleName,
          };

          await sails.helpers.storage.apiStatusUpdateJoi(apiStatusUpdateParams);

        }

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

        /**
         * Передаём параметр для определения стартовой глубины поиска для повторной проверки
         */

        // checkProfileSubscriptionParams.checkRenewIndex = checkProfileSubscriptionResRaw.payload.checkRenewIndex || 0;

        await sleep(parserRequestIntervals[i] * parserRequestIntervalTime);

        activeParser = await sails.helpers.parsers.getParserJoi(getParserParams);

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


      await sails.helpers.storage.pendingActionsUpdateJoi({
        criteria: {
          guid: pendingSubscription.guid,
        },
        data: {
          checkInProgress: false,
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

        /**
         * Устанавливаем флаг, что запись не находится в обработке
         */

        await sails.helpers.storage.pendingActionsUpdateJoi({
          criteria: {
            guid: pendingSubscription.guid,
          },
          data: {
            checkInProgress: false,
          }
        });

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


      await sails.helpers.storage.pendingActionsUpdateJoi({
        criteria: {
          guid: pendingSubscription.guid,
        },
        data: {
          payloadResponse: checkProfileSubscriptionRes,
          // checkInProgress: false,
          // done: true,
        }
      });

      pendingSubscription.payloadResponse = checkProfileSubscriptionRes;

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

      const getAccountRaw = await sails.helpers.storage.accountGetJoi({
        accountGuids: account.guid,
      });

      if (getAccountRaw.status !== 'ok') {

        /**
         * Устанавливаем флаг, что запись не находится в обработке
         */

        await sails.helpers.storage.pendingActionsUpdateJoi({
          criteria: {
            guid: pendingSubscription.guid,
          },
          data: {
            checkInProgress: false,
          }
        });

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

        /**
         * Устанавливаем флаг, что запись не находится в обработке
         */

        await sails.helpers.storage.pendingActionsUpdateJoi({
          criteria: {
            guid: pendingSubscription.guid,
          },
          data: {
            checkInProgress: false,
          }
        });

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

      accountUpdated = getAccountRaw.payload[0];

      if (_.toString(accountUpdated.keyboard) === '') {

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
            accountUpdated,
          },
        });


        const sleepInterval = _.get(sails.config.custom.config, 'schedule.intervals.processPendingRefSubscription', null);

        if (sleepInterval == null) {

          /**
           * Устанавливаем флаг, что запись не находится в обработке
           */

          await sails.helpers.storage.pendingActionsUpdateJoi({
            criteria: {
              guid: pendingSubscription.guid,
            },
            data: {
              checkInProgress: false,
            }
          });

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

          /**
           * Устанавливаем флаг, что запись не находится в обработке
           */

          await sails.helpers.storage.pendingActionsUpdateJoi({
            criteria: {
              guid: pendingSubscription.guid,
            },
            data: {
              checkInProgress: false,
            }
          });

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

          /**
           * Устанавливаем флаг, что запись не находится в обработке
           */

          await sails.helpers.storage.pendingActionsUpdateJoi({
            criteria: {
              guid: pendingSubscription.guid,
            },
            data: {
              checkInProgress: false,
            }
          });

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

        accountUpdated = getAccountRaw.payload[0];

        if (_.toString(accountUpdated.keyboard) === '') {

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
              accountUpdated,
            },
          });

          /**
           * Устанавливаем флаг, что запись не находится в обработке
           */

          await sails.helpers.storage.pendingActionsUpdateJoi({
            criteria: {
              guid: pendingSubscription.guid,
            },
            data: {
              checkInProgress: false,
            }
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

        /**
         * Устанавливаем флаг, что запись не находится в обработке
         */

        await sails.helpers.storage.pendingActionsUpdateJoi({
          criteria: {
            guid: pendingSubscription.guid,
          },
          data: {
            checkInProgress: false,
          }
        });

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

        /**
         * Достаём данные PushMessage
         */

        const pushMessageName = currentAccount.service.push_message_name;

        const pushMessageGetParams = {
          pushMessageName,
        };

        const pushMessageGetRaw = await sails.helpers.storage.pushMessageGetJoi(pushMessageGetParams);

        if (pushMessageGetRaw.status !== 'ok') {
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'Wrong pushMessageGetJoi response',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.STORAGE_ERROR.name,
            payload: {
              pushMessageGetParams,
              pushMessageGetRaw,
            },
          });

        }

        pushMessage = pushMessageGetRaw.payload;

        const messageDataPath = 'scheduler.refProfileSubscriptionCheck.joinRefDone';
        const messageData = _.get(pushMessage, messageDataPath, null);

        if (messageData == null) {
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'No expected messageData',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.STORAGE_ERROR.name,
            payload: {
              pushMessage,
              messageDataPath,
              messageData,
            },
          });
        }

        const msgRes = await sails.helpers.messageProcessor.sendMessageJoi({
          client,
          messageData,
        });

        await sails.helpers.storage.pendingActionsUpdateJoi({
          criteria: {
            guid: pendingSubscription.guid,
          },
          data: {
            done: true,
            checkInProgress: false,
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

        client.current_funnel = '';

        account.keyboard = 'refProfileSubscriptionCheck::start';

        await sails.helpers.storage.clientUpdateJoi({
          criteria: {guid: client.guid},
          data: client,
          createdBy: moduleName,
        });

        const sendKeyboardForAccountParams = {
          client,
          additionalData: {
            profiles: pendingSubscription.payloadResponse.notSubscribed,
          }
        };

        const sendKeyboardForAccountRaw = await sails.helpers.keyboardProcessor.sendKeyboardForAccountJoi(sendKeyboardForAccountParams);

        if (sendKeyboardForAccountRaw.status !== 'ok') {

          /**
           * Устанавливаем флаг, что запись не находится в обработке
           */

          await sails.helpers.storage.pendingActionsUpdateJoi({
            criteria: {
              guid: pendingSubscription.guid,
            },
            data: {
              checkInProgress: false,
            }
          });

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

        /**
         * Устанавливаем флаг, что запись не находится в обработке
         */

        // await sails.helpers.storage.pendingActionsUpdateJoi({
        //   criteria: {
        //     guid: pendingSubscription.guid,
        //   },
        //   data: {
        //     checkInProgress: false,
        //   }
        // });


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


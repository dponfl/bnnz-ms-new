"use strict";

const sleep = require('util').promisify(setTimeout);
const moment = require('moment');

const moduleName = 'scheduler:accounts:test-initial-update';


module.exports = {


  friendlyName: 'scheduler:accounts:test-initial-update',


  description: 'scheduler:accounts:test-initial-update',


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

    const nameTestPersonalInitial = sails.config.custom.config.accounts.testPersonalInitial;
    const nameTestCommercialInitial = sails.config.custom.config.accounts.testCommercialInitial;

    try {

      if (_.isNil(nameTestPersonalInitial)
      || _.isNil(nameTestCommercialInitial)
      || _.isNil(nameTestPersonalInitial.fromName)
      || _.isNil(nameTestPersonalInitial.toName)
      || _.isNil(nameTestCommercialInitial.fromName)
      || _.isNil(nameTestCommercialInitial.toName)) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: 'Config data corrupted for accounts.testXXXInitial',
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            nameTestPersonalInitial,
            nameTestCommercialInitial,
          },
        });
      }

      await processAccounts(nameTestPersonalInitial);
      await processAccounts(nameTestCommercialInitial);

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      })

    } catch (e) {

      const throwError = true;
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

async function processAccounts(params) {

  const methodName = 'processAccounts';

  const platform = 'core';
  const action = 'scheduler';
  const api = 'accounts';
  const requestType = 'testInitialUpdate';
  const momentStart = moment();

  let testInitialAccountsRecs;

  try {

    const serviceRec = await Service.findOne({
      name: params.fromName
    })
      .tolerate(async (err) => {

        err.details = {
          name: params.fromName,
        };

        await LogProcessor.dbError({
          error: err,
          message: 'Service.findOne() error',
          // clientGuid,
          // accountGuid,
          // requestId: null,
          // childRequestId: null,
          location: `${moduleName}:${methodName}`,
          payload: {
            name: params.fromName,
          },
        });

        return 'error';
      });

    if (serviceRec === 'error' || _.isNil(serviceRec)) {
      await sails.helpers.general.throwErrorJoi({
        errorType: sails.config.custom.enums.errorType.CRITICAL,
        emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
        location: `${moduleName}:${methodName}`,
        message: 'Service.findOne() error',
        // clientGuid,
        // accountGuid,
        errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
        payload: {
          name: params.fromName,
        },
      });
    }

    const serviceId = serviceRec.id;


    const serviceToRec = await Service.findOne({
      name: params.toName
    })
      .tolerate(async (err) => {

        err.details = {
          name: params.toName,
        };

        await LogProcessor.dbError({
          error: err,
          message: 'Service.findOne() error',
          // clientGuid,
          // accountGuid,
          // requestId: null,
          // childRequestId: null,
          location: `${moduleName}:${methodName}`,
          payload: {
            name: params.toName,
          },
        });

        return 'error';
      });

    if (serviceToRec === 'error' || _.isNil(serviceToRec)) {
      await sails.helpers.general.throwErrorJoi({
        errorType: sails.config.custom.enums.errorType.CRITICAL,
        emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
        location: `${moduleName}:${methodName}`,
        message: 'Service.findOne() error',
        // clientGuid,
        // accountGuid,
        errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
        payload: {
          name: params.toName,
        },
      });
    }

    const serviceToId = serviceToRec.id;


    /**
     * Используем DB lock
     */

    const lockTimeOut = sails.config.custom.config.db.lockTimeOut || 600;

    const sqlGetLockTestInitialUpdate = `
    SELECT GET_LOCK('testInitialUpdateLock', ${lockTimeOut}) as getTestInitialUpdateLockResult
    `;

    const sqlReleaseLockTestInitialUpdate = `
    SELECT RELEASE_LOCK('testInitialUpdateLock') as releaseTestInitialUpdateLockResult
    `;

    await sails.getDatastore('clientDb')
      .leaseConnection(async (db) => {

        try {

          const resGetLock = await sails
            .sendNativeQuery(sqlGetLockTestInitialUpdate)
            .usingConnection(db);

          const getLockRes = _.get(resGetLock, 'rows[0].getTestInitialUpdateLockResult', null);

          if (getLockRes == null) {
            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
              location: `${moduleName}:${methodName}`,
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
              location: `${moduleName}:${methodName}`,
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

          const limit = _.find(sails.config.custom.config.schedule.rules, {action: "testInitialUpdate"}).getRecordsLimit || 1000;

          const initialPeriodStartCalcValue = sails.config.custom.config.accounts.testInitialPeriod.amount || 5;
          const initialPeriodStartCalcUnit = sails.config.custom.config.accounts.testInitialPeriod.unit || 'days';


          const initialPeriodStart = moment().subtract(initialPeriodStartCalcValue, initialPeriodStartCalcUnit).startOf('day').format();


          const testInitialAccountsParams = {
            createdAt: {
              // '<=': moment(initialPeriodStart).format()
              '<=': initialPeriodStart,
            },
            deleted: false,
            banned: false,
            subscription_active: true,
            service: serviceId,
          };

          testInitialAccountsRecs = await Account.find({
            where: testInitialAccountsParams,
          })
            .populate('service')
            .populate('next_service')
            .populate('room')
            .limit(limit)
            .tolerate(async (err) => {

              err.details = {
                where: testInitialAccountsParams,
                limit,
              };

              await LogProcessor.dbError({
                error: err,
                message: 'Account.find() error',
                // clientGuid,
                // accountGuid,
                // requestId: null,
                // childRequestId: null,
                location: `${moduleName}:${methodName}`,
                payload: {
                  where: testInitialAccountsParams,
                  limit,
                },
              });

              return [];
            });


          // TODO: Delete after QA

          await LogProcessor.info({
            message: `Test Initial Update Run: found ${testInitialAccountsRecs.length} records (service: ${params.fromName}) to be processed`,
            location: `${moduleName}:${methodName}`,
          });


          for (const account of testInitialAccountsRecs) {

            const accountGuid = account.guid;


            const clientGetByCriteriaParams = {
              criteria: {
                id: account.client,
              }
            }

            const clientRaw = await sails.helpers.storage.clientGetByCriteriaJoi(clientGetByCriteriaParams);

            if (clientRaw.status !== 'ok') {
              await LogProcessor.critical({
                message: 'client not found',
                // clientGuid,
                accountGuid,
                // requestId: null,
                // childRequestId: null,
                errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
                location: `${moduleName}:${methodName}`,
                payload: {
                  clientGetByCriteriaParams,
                  clientRaw,
                },
              });
              continue;
            }

            if (clientRaw.payload.length !== 1) {
              await LogProcessor.critical({
                message: 'several or none client records found',
                // clientGuid,
                accountGuid,
                // requestId: null,
                // childRequestId: null,
                errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
                location: `${moduleName}:${methodName}`,
                payload: {
                  clientGetByCriteriaParams,
                  clientRaw,
                },
              });
              continue;
            }

            const client = clientRaw.payload[0];

            const clientGuid = client.guid;

            /**
             * Меняем сервисный уровень
             */

            const accountUpdateParams = {
              criteria: {
                id: account.id,
              },
              data: {
                service: serviceToRec,
              },
              createdBy: `${moduleName}:${methodName}`,
            }

            const accountUpdateRaw = await sails.helpers.storage.accountUpdateJoi(accountUpdateParams);

            if (
              _.isNil(accountUpdateRaw)
              || _.isNil(accountUpdateRaw.status)
              || accountUpdateRaw.status !== 'ok'
            ) {
              await LogProcessor.critical({
                message: 'Wrong response from accountUpdateJoi',
                clientGuid,
                accountGuid,
                // requestId: null,
                // childRequestId: null,
                errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                location: `${moduleName}:${methodName}`,
                payload: {
                  accountUpdateParams,
                  accountUpdateRaw,
                },
              });
              continue;
            }

            const updatedAccountRaw = await Account.find({
              where: {
                id: account.id,
              },
            })
              .populate('service')
              .populate('next_service')
              .populate('room')
              .limit(limit)
              .tolerate(async (err) => {

                err.details = {
                  where: {
                    id: account.id,
                  },
                };

                await LogProcessor.dbError({
                  error: err,
                  message: 'Account.find() error',
                  clientGuid,
                  accountGuid,
                  // requestId: null,
                  // childRequestId: null,
                  location: `${moduleName}:${methodName}`,
                  payload: {
                    where: {
                      id: account.id,
                    },
                  },
                });

                return [];
              });

            if (
              !_.isArray(updatedAccountRaw)
              || updatedAccountRaw.length !== 1
            ) {
              await LogProcessor.critical({
                message: 'Wrong response from Account.find(...)',
                clientGuid,
                accountGuid,
                // requestId: null,
                // childRequestId: null,
                errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
                location: `${moduleName}:${methodName}`,
                payload: {
                  where: {
                    id: account.id,
                  },
                  updatedAccountRaw,
                },
              });
              continue;
            }

            /**
             * Прописываем аккаунт в другие комнаты
             */

            const reallocateRoomsToAccountJoiParams = {
              account: updatedAccountRaw[0],
              previousServiceName: params.fromName,
            };

            const reallocateRoomsToAccountJoiRaw = await sails.helpers.general.reallocateRoomsToAccountJoi(reallocateRoomsToAccountJoiParams);

            if (_.isNil(reallocateRoomsToAccountJoiRaw)
              || _.isNil(reallocateRoomsToAccountJoiRaw.status)
              || reallocateRoomsToAccountJoiRaw.status !== 'ok'
            ) {
              await LogProcessor.critical({
                message: 'Wrong reallocateRoomsToAccountJoi response',
                clientGuid,
                accountGuid,
                // requestId: null,
                // childRequestId: null,
                errorName: sails.config.custom.GENERAL_ERROR.name,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                location: `${moduleName}:${methodName}`,
                payload: {
                  reallocateRoomsToAccountJoiParams,
                  reallocateRoomsToAccountJoiRaw,
                },
              });
              continue;
            }

            /**
             * Отправляем клиенту сообщение о переводе его аккаунта
             * в другую категорию
             */

            /**
             * Достаём данные PushMessage
             */

            const pushMessageName = account.service.push_message_name;

            const pushMessageGetParams = {
              pushMessageName,
            };

            const pushMessageGetRaw = await sails.helpers.storage.pushMessageGetJoi(pushMessageGetParams);

            if (pushMessageGetRaw.status !== 'ok') {
              await LogProcessor.critical({
                message: 'Wrong pushMessageGetJoi response',
                clientGuid,
                accountGuid,
                // requestId: null,
                // childRequestId: null,
                errorName: sails.config.custom.STORAGE_ERROR.name,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                location: `${moduleName}:${methodName}`,
                payload: {
                  pushMessageGetParams,
                  pushMessageGetRaw,
                },
              });
              continue;
            }

            const pushMessage = pushMessageGetRaw.payload;

            const messageDataPath = 'scheduler.testInitialUpdate';
            const messageData = _.get(pushMessage, messageDataPath, null);

            if (messageData == null) {
              await LogProcessor.critical({
                message: 'No expected messageData',
                clientGuid,
                accountGuid,
                // requestId: null,
                // childRequestId: null,
                errorName: sails.config.custom.STORAGE_ERROR.name,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                location: `${moduleName}:${methodName}`,
                payload: {
                  pushMessage,
                  messageDataPath,
                  messageData,
                },
              });
              continue;
            }

            const instProfile = account.inst_profile || '';

            await sails.helpers.messageProcessor.sendMessageJoi({
              client,
              messageData,
              additionalTokens: [
                {
                  token: '$TestInitialAccount$',
                  value: instProfile,
                },
              ],
            });

          }


          const momentDone = moment();

          const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

          const performanceCreateParams = {
            platform,
            action,
            api,
            requestType,
            requestDuration,
            status: 'success',
            comments: {
              serviceName: params.fromName,
              numberOfTestInitialAccounts: testInitialAccountsRecs.length,
            },
          };

          await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);



          const ReleaseLock = await sails
            .sendNativeQuery(sqlReleaseLockTestInitialUpdate)
            .usingConnection(db);

          const releaseLockRes = _.get(ReleaseLock, 'rows[0].releaseTestInitialUpdateLockResult', null);

          if (releaseLockRes == null) {
            await LogProcessor.critical({
              message: sails.config.custom.DB_ERROR_RELEASE_LOCK_WRONG_RESPONSE.message,
              // clientGuid,
              // accountGuid,
              // requestId: null,
              // childRequestId: null,
              errorName: sails.config.custom.DB_ERROR_RELEASE_LOCK_WRONG_RESPONSE.name,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
              location: `${moduleName}:${methodName}`,
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
              location: `${moduleName}:${methodName}`,
              payload: {
                releaseLockRes,
              },
            });
          }

          return;

        } catch (ee) {

          const ReleaseLock = await sails
            .sendNativeQuery(sqlReleaseLockTestInitialUpdate)
            .usingConnection(db);

          const releaseLockRes = _.get(ReleaseLock, 'rows[0].releaseTestInitialUpdateLockResult', null);

          if (releaseLockRes == null) {
            await LogProcessor.critical({
              message: sails.config.custom.DB_ERROR_RELEASE_LOCK_WRONG_RESPONSE.message,
              // clientGuid,
              // accountGuid,
              // requestId: null,
              // childRequestId: null,
              errorName: sails.config.custom.DB_ERROR_RELEASE_LOCK_WRONG_RESPONSE.name,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
              location: `${moduleName}:${methodName}`,
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
              location: `${moduleName}:${methodName}`,
              payload: {
                releaseLockRes,
              },
            });
          }

          const throwError = true;
          if (throwError) {
            return await sails.helpers.general.catchErrorJoi({
              error: ee,
              location: `${moduleName}:${methodName}`,
              throwError: true,
            });
          } else {
            await sails.helpers.general.catchErrorJoi({
              error: ee,
              location: `${moduleName}:${methodName}`,
              throwError: false,
            });
            return exits.success({
              status: 'ok',
              message: `${moduleName}:${methodName} performed`,
              payload: {},
            });
          }

        }

      }); // .leaseConnection()


    return testInitialAccountsRecs;

  } catch (e) {

    const throwError = true;
    if (throwError) {
      return await sails.helpers.general.catchErrorJoi({
        error: e,
        location: `${moduleName}:${methodName}`,
        throwError: true,
      });
    } else {
      await sails.helpers.general.catchErrorJoi({
        error: e,
        location: `${moduleName}:${methodName}`,
        throwError: false,
      });
      return exits.success({
        status: 'ok',
        message: `${moduleName}:${methodName} performed`,
        payload: {},
      });
    }

  }

}


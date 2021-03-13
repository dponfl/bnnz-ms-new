"use strict";

const sleep = require('util').promisify(setTimeout);
const moment = require('moment');

const moduleName = 'scheduler:pending-messages:push-pending-messages';


module.exports = {


  friendlyName: 'scheduler:pending-messages:push-pending-messages',


  description: 'scheduler:pending-messages:push-pending-messages',


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

    const platform = 'core';
    const action = 'scheduler';
    const api = 'pendingMessages';
    const requestType = 'pushPendingMessages';
    const momentStart = moment();

    try {

      /**
       * Используем DB lock
       */

      const lockTimeOut = sails.config.custom.config.db.lockTimeOut || 600;

      const sqlGetLockPushPendingMessages = `
    SELECT GET_LOCK('pushPendingMessagesLock', ${lockTimeOut}) as getPushPendingMessagesLockResult
    `;

      const sqlReleaseLockPushPendingMessages = `
    SELECT RELEASE_LOCK('pushPendingMessagesLock') as releasePushPendingMessagesLockResult
    `;

      await sails.getDatastore('clientDb')
        .leaseConnection(async (db) => {

          try {

            const resGetLock = await sails
              .sendNativeQuery(sqlGetLockPushPendingMessages)
              .usingConnection(db);

            const getLockRes = _.get(resGetLock, 'rows[0].getPushPendingMessagesLockResult', null);

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

            const limit = _.find(sails.config.custom.config.schedule.rules, {action: "pushPendingMessages"}).getRecordsLimit || 1000;

            const getPendingMessagesParams = {
              criteria: {
                done: false,
                deleted: false,
              },
              limit,
            };

            const pendingMessagesRaw = await sails.helpers.storage.pendingMessagesGetJoi(getPendingMessagesParams);

            if (pendingMessagesRaw.status !== 'ok') {

              await LogProcessor.error({
                message: 'Wrong "pendingMessagesGetJoi" response: status',
                // clientGuid,
                // accountGuid,
                // requestId: null,
                // childRequestId: null,
                errorName: sails.config.custom.SCHEDULER_ERROR.name,
                location: moduleName,
                payload: {
                  getPendingMessagesParams,
                  pendingMessagesRaw,
                },
              });

              return exits.success({
                status: 'error',
                message: `${moduleName} performed`,
                payload: {},
              })

            }

            const pendingMessages = _.get(pendingMessagesRaw, 'payload', null);

            if (pendingMessages == null) {

              await LogProcessor.error({
                message: 'Wrong "pendingMessagesGetJoi" response: payload',
                // clientGuid,
                // accountGuid,
                // requestId: null,
                // childRequestId: null,
                errorName: sails.config.custom.SCHEDULER_ERROR.name,
                location: moduleName,
                payload: {
                  getPendingMessagesParams,
                  pendingMessagesRaw,
                },
              });

              return exits.success({
                status: 'error',
                message: `${moduleName} performed`,
                payload: {},
              })

            }


            // TODO: Delete after QA

            await LogProcessor.info({
              message: `Push Pending Messages Run: found ${pendingMessages.length} records to be processed`,
              location: moduleName,
            });

            if (pendingMessages.length > 0) {

              /**
               * Формируем объект, где ключем является clientGuid,
               * а в нем содержится массив с отложенными сообщениями
               * для этого клиента
               */

              const messagesByClient = {};

              for (const pendingMsg of pendingMessages) {

                if (messagesByClient[pendingMsg.clientGuid] == null) {
                  messagesByClient[pendingMsg.clientGuid] = [pendingMsg];
                } else {
                  messagesByClient[pendingMsg.clientGuid].push(pendingMsg);
                }

              }

              /**
               * Для каждого елемента messagesByClient проверяем,
               * доступен ли клиент для отправки сообщений и если "да",
               * то выполняем отправку отложенных сообщений
               */


              for (const key in messagesByClient) {

                const clientGetByCriteriaParams = {
                  criteria: {
                    guid: key,
                  }
                };

                const clientGetRaw = await sails.helpers.storage.clientGetByCriteriaJoi(clientGetByCriteriaParams);

                if (clientGetRaw.status == null
                || clientGetRaw.status !== 'ok'
                || clientGetRaw.payload == null
                || clientGetRaw.payload.length == null) {
                  await LogProcessor.critical({
                    message: 'Wrong reply from clientGetByCriteriaJoi',
                    // clientGuid,
                    // accountGuid,
                    // requestId: null,
                    // childRequestId: null,
                    errorName: sails.config.custom.GENERAL_ERROR.name,
                    emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                    location: moduleName,
                    payload: {
                      clientGetByCriteriaParams,
                      clientGetRaw,
                    },
                  });
                }

                if (clientGetRaw.payload.length !== 1) {
                  await LogProcessor.critical({
                    message: 'Several client records for guid',
                    // clientGuid,
                    // accountGuid,
                    // requestId: null,
                    // childRequestId: null,
                    errorName: sails.config.custom.GENERAL_ERROR.name,
                    emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
                    location: moduleName,
                    payload: {
                      clientGetByCriteriaParams,
                      clientGetRaw,
                    },
                  });
                }

                const client = clientGetRaw.payload[0];

                if (!client.dnd) {

                  /**
                   * Клиенту можно отправлять сообщения
                   */

                  for (const msgRaw of messagesByClient[key]) {

                    _.assign(msgRaw.payload, {forced: true});

                    const sendMsgRes = await sails.helpers.messageProcessor.sendMessageJoi(msgRaw.payload);

                    if (sendMsgRes.status != null
                    && sendMsgRes.status === 'ok') {

                      // TODO: В дальнейшем нужно удалять эту запись из таблицы

                      const pendingMessagesUpdateParams = {
                        criteria: {
                          guid: msgRaw.payload.guid,
                        },
                        data: {
                          done: true,
                        }
                      };

                      const pendingMsgUpdateRes = await sails.helpers.storage.pendingMessagesUpdateJoi(pendingMessagesUpdateParams);

                      if (pendingMsgUpdateRes.status == null
                      || pendingMsgUpdateRes.status !== 'ok') {
                        await sails.helpers.general.throwErrorJoi({
                          errorType: sails.config.custom.enums.errorType.ERROR,
                          location: moduleName,
                          message: 'Wrong response from pendingMessagesUpdateJoi',
                          errorName: sails.config.custom.GENERAL_ERROR.name,
                          payload: {
                            pendingMessagesUpdateParams,
                            pendingMsgUpdateRes,
                          },
                        });
                      }

                    }

                  }

                }

              }

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
                numberOfPendingMessages: pendingMessages.length,
              },
            };

            await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);



            const ReleaseLock = await sails
              .sendNativeQuery(sqlReleaseLockPushPendingMessages)
              .usingConnection(db);

            const releaseLockRes = _.get(ReleaseLock, 'rows[0].releasePushPendingMessagesLockResult', null);

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
              .sendNativeQuery(sqlReleaseLockPushPendingMessages)
              .usingConnection(db);

            const releaseLockRes = _.get(ReleaseLock, 'rows[0].releasePushPendingMessagesLockResult', null);

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


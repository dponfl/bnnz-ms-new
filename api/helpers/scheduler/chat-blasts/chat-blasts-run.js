"use strict";

const moment = require('moment');
const uuid = require('uuid-apikey');

const moduleName = 'scheduler:chat-blasts:chat-blasts-run';

let requestId;

module.exports = {


  friendlyName: 'scheduler:chat-blasts:chat-blasts-run',


  description: 'scheduler:chat-blasts:chat-blasts-run',


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

    requestId = uuid.create().uuid;

    let chatBlastsRecords;

    try {

      await LogProcessor.info({
        message: 'Chat Blasts Run: activated',
        requestId,
        location: moduleName,
      });


      /**
       * Используем DB lock
       */

      const lockTimeOut = sails.config.custom.config.db.lockTimeOut || 600;

      const sqlGetLockChatBlastsRun = `
    SELECT GET_LOCK('chatBlastsRunLock', ${lockTimeOut}) as getChatBlastsRunLockResult
    `;

      const sqlReleaseLockApiStatusUpdate = `
    SELECT RELEASE_LOCK('chatBlastsRunLock') as releaseChatBlastsRunLockResult
    `;

      await sails.getDatastore('clientDb')
        .leaseConnection(async (db) => {

          try {

            const resGetLock = await sails
              .sendNativeQuery(sqlGetLockChatBlastsRun)
              .usingConnection(db);

            const getLockRes = _.get(resGetLock, 'rows[0].getChatBlastsRunLockResult', null);

            if (getLockRes == null) {
              await sails.helpers.general.throwErrorJoi({
                errorType: sails.config.custom.enums.errorType.CRITICAL,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                requestId,
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
                requestId,
                location: moduleName,
                message: sails.config.custom.DB_ERROR_GET_LOCK_DECLINE.message,
                errorName: sails.config.custom.DB_ERROR_GET_LOCK_DECLINE.name,
                payload: {
                  resGetLock,
                },
              });
            }

            /**
             * Начало блока целевых действий внутри лока
             */

            chatBlastsRecords = await ChatBlastsPerformance.find({
              where: {
                deleted: false,
                done: false,
                actionTime: {
                  '<=': moment().format()
                },
              },
            })
              .tolerate(async (err) => {

                err.details = {
                  deleted: false,
                  done: false,
                  actionTime: {
                    '<=': moment().format()
                  },
                };

                await LogProcessor.dbError({
                  error: err,
                  message: 'ChatBlastsPerformance.find error',
                  requestId,
                  location: moduleName,
                  payload: {
                    deleted: false,
                    done: false,
                    actionTime: {
                      '<=': moment().format()
                    },
                  },
                });

                return 'error';
              });

            if (chatBlastsRecords === 'error') {
              await sails.helpers.general.throwErrorJoi({
                errorType: sails.config.custom.enums.errorType.CRITICAL,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
                requestId,
                location: moduleName,
                message: 'ChatBlastsPerformance.find error',
                errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
                payload: {
                  deleted: false,
                  done: false,
                  actionTime: {
                    '<=': moment().format()
                  },
                },
              });
            }

            await LogProcessor.info({
              message: `Chat Blasts Run: found ${chatBlastsRecords.length} records`,
              requestId,
              location: moduleName,
            });

            for (const chatBlastsRec of chatBlastsRecords) {
              await processChatBlast(chatBlastsRec);
            }

            /**
             * Окончание блока целевых действий внутри лока
             */

            const ReleaseLock = await sails
              .sendNativeQuery(sqlReleaseLockApiStatusUpdate)
              .usingConnection(db);

            const releaseLockRes = _.get(ReleaseLock, 'rows[0].releaseChatBlastsRunLockResult', null);

            if (releaseLockRes == null) {
              await LogProcessor.critical({
                message: sails.config.custom.DB_ERROR_RELEASE_LOCK_WRONG_RESPONSE.message,
                requestId,
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
                requestId,
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
              .sendNativeQuery(sqlReleaseLockApiStatusUpdate)
              .usingConnection(db);

            const releaseLockRes = _.get(ReleaseLock, 'rows[0].releaseChatBlastsRunLockResult', null);

            if (releaseLockRes == null) {
              await LogProcessor.critical({
                message: sails.config.custom.DB_ERROR_RELEASE_LOCK_WRONG_RESPONSE.message,
                requestId,
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
                requestId,
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
                throwError,
              });
            } else {
              await sails.helpers.general.catchErrorJoi({
                error: ee,
                location: moduleName,
                throwError,
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
          throwError,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError,
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

async function processChatBlast(rec) {

  const methodName = 'processChatBlast';

  const clientGuid = rec.clientGuid;
  const accountGuid = rec.accountGuid;

  const childRequestId = uuid.create().uuid;

  const currentElem = _.find(rec.actionsList, {id: rec.actionName});

  if (currentElem == null) {

    /**
     * Не можем найти элемент по указанному значению
     */

    await LogProcessor.critical({
      message: sails.config.custom.CHAT_BLASTS_ERROR_NO_ELEMENT.message,
      requestId,
      childRequestId,
      clientGuid,
      accountGuid,
      errorName: sails.config.custom.CHAT_BLASTS_ERROR_NO_ELEMENT.name,
      emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
      location: `${moduleName}::${methodName}`,
      payload: {
        chatBlastRecGuid: rec.guid,
        actionName: rec.actionName,
      },
    });

    return;

  }

  if (currentElem.shown) {

    /**
     * Этот элемент уже был обработан (сообщение было отправлено)
     */

    await LogProcessor.critical({
      message: sails.config.custom.CHAT_BLASTS_ERROR_ELEMENT_ALREADY_SHOWN.message,
      requestId,
      childRequestId,
      clientGuid,
      accountGuid,
      errorName: sails.config.custom.CHAT_BLASTS_ERROR_ELEMENT_ALREADY_SHOWN.name,
      emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
      location: `${moduleName}::${methodName}`,
      payload: {
        chatBlastRecGuid: rec.guid,
        actionName: rec.actionName,
        currentElem,
      },
    });

    return;

  }

  /**
   * Достаём запись клиента
   */

  const clientRaw = await sails.helpers.storage.clientGetByCriteriaJoi({
    criteria: {
      guid: clientGuid,
    }
  });

  if (clientRaw.status !== 'ok') {

    await LogProcessor.critical({
      message: 'client not found',
      requestId,
      childRequestId,
      clientGuid,
      accountGuid,
      errorName: sails.config.custom.GENERAL_ERROR.name,
      emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
      location: `${moduleName}::${methodName}`,
      payload: null,
    });

    return;
  }

  if (clientRaw.payload.length !== 1) {

    await LogProcessor.critical({
      message: 'several or none client records found',
      requestId,
      childRequestId,
      clientGuid,
      accountGuid,
      errorName: sails.config.custom.GENERAL_ERROR.name,
      emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
      location: `${moduleName}::${methodName}`,
      payload: null,
    });

    return;
  }

  const client = clientRaw.payload[0];

  const sendMessageParams = {
    client,
    messageData: currentElem.message,
  };

  const msgRes = await sails.helpers.messageProcessor.sendMessageJoi(sendMessageParams);

  if (msgRes.status !== 'ok') {

    await LogProcessor.critical({
      message: 'Wrong sendMessageJoi response',
      requestId,
      childRequestId,
      clientGuid,
      accountGuid,
      errorName: sails.config.custom.GENERAL_ERROR.name,
      emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
      location: `${moduleName}::${methodName}`,
      payload: {
        sendMessageParams,
        msgRes,
      },
    });

    return;
  }

}

async function bbb() {

  const methodName = 'bbb';



}


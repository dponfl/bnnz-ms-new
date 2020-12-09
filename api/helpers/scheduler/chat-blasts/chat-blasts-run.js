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

    const platform = 'core';
    const action = 'scheduler';
    const api = 'ChatBlasts';
    const requestType = 'chatBlastsRun';
    const momentStart = moment();

    requestId = uuid.create().uuid;

    let chatBlastsRecords;

    try {

      // await LogProcessor.info({
      //   message: 'Chat Blasts Run: started...',
      //   requestId,
      //   location: moduleName,
      // });


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

            const findCriteria = {
              deleted: false,
              done: false,
              callback: false,
              actionTime: {
                '<=': moment().format()
              },
            };

            chatBlastsRecords = await ChatBlastsPerformance.find({
              where: findCriteria,
            })
              .tolerate(async (err) => {

                await sails.helpers.general.throwErrorJoi({
                  errorType: sails.config.custom.enums.errorType.CRITICAL,
                  emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                  requestId,
                  location: moduleName,
                  message: sails.config.custom.CHAT_BLASTS_ERROR_PERFORMANCE_REC_FIND_ERROR.message,
                  errorName: sails.config.custom.CHAT_BLASTS_ERROR_PERFORMANCE_REC_FIND_ERROR.name,
                  payload: {
                    findCriteria,
                    err,
                  },
                });

                return 'error';
              });

            await LogProcessor.info({
              message: `Chat Blasts Run: found ${chatBlastsRecords.length} records to be processed`,
              requestId,
              location: moduleName,
            });

            for (const chatBlastsRec of chatBlastsRecords) {
              await processChatBlast(chatBlastsRec);
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
                numberOfChatBlastsProcessed: chatBlastsRecords.length,
              },
            };

            await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);


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

  if (clientRaw.status == null || clientRaw.status !== 'ok') {

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

  /**
   * Проверяем, что клиент находится в клавиатуре, а не в какой-то воронке
   */

  const currentAccount = _.find(client.accounts, {guid: client.account_use});

  if (_.toString(currentAccount.keyboard) !== '') {
    await processChatBlastElement(client, rec, currentElem);
  } else {
    await LogProcessor.info({
      message: `The client not in keyboard: skip processing Chat Blast element`,
      clientGuid,
      accountGuid,
      requestId,
      childRequestId,
      location: moduleName,
      payload: {
        chatBlastRecGuid: rec.guid,
        currentElem,
      }
    });
  }

}

async function processChatBlastElement(client, rec, currentElem) {

  const methodName = 'processChatBlastElement';

  const childRequestId = uuid.create().uuid;

  const clientGuid = rec.clientGuid;
  const accountGuid = rec.accountGuid;

  let performNextElementNow = false;
  let nextElem;

  const sendMessageParams = {
    client,
    messageData: currentElem,
    blockModifyHelperParams: {
      chatBlastGuid: rec.guid,
      elementId: currentElem.id,
    }
  };

  const msgRes = await sails.helpers.messageProcessor.sendMessageJoi(sendMessageParams);

  if (msgRes.status == null || msgRes.status !== 'ok') {

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

  currentElem.shown = true;

  if (currentElem.next != null && currentElem.next !== '$callback$') {

    /**
     * Выполняем неоходимые действия для подготовки активизации или
     * выполняем активацию следующего элемента
     */

    rec.actionName = currentElem.next;

    nextElem = _.find(rec.actionsList, {id: currentElem.next});

    if (nextElem == null) {

      /**
       * Не можем найти следующий элемент по указанному значению
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
          next: currentElem.next,
        },
      });

      return;

    }

    if (nextElem.shown) {

      /**
       * Следующий элемент уже был обработан (сообщение было отправлено)
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
          next: currentElem.next,
          currentElem,
          nextElem,
        },
      });

      return;

    }

    switch (nextElem.timeType) {
      case sails.config.custom.enums.chatBlastsTimeTypes.ABSOLUTE:
        rec.actionTime = moment(nextElem.showTime).format();
        break;

      case sails.config.custom.enums.chatBlastsTimeTypes.RELATIVE:
        rec.actionTime = moment().add(nextElem.showTime).format();
        break;

      case sails.config.custom.enums.chatBlastsTimeTypes.NOW:
        rec.actionTime = moment().format();
        performNextElementNow = true;
        break;

      default:
        await LogProcessor.critical({
          message: sails.config.custom.CHAT_BLASTS_ERROR_UNKNOWN_TIMETYPE.message,
          requestId,
          childRequestId,
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.CHAT_BLASTS_ERROR_UNKNOWN_TIMETYPE.name,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: `${moduleName}::${methodName}`,
          payload: {
            chatBlastRecGuid: rec.guid,
            nextElem,
          },
        });

        return;
    }

  }
  else if (currentElem.next === '$callback$') {
    rec.callback = true;
  } else {

    /**
     * Вариант, когда currentElem.next === null
     */

    rec.done = true;
  }

  /**
   * Сохраняем изменения, внесённые в значения элементов записи "rec"
   */

  const ChatBlastsPerformanceUpdateCriteria = {
    guid: rec.guid,
  };

  await ChatBlastsPerformance
    .updateOne(ChatBlastsPerformanceUpdateCriteria)
    .set(_.omit(rec, ['createdAt', 'updatedAt', 'id', 'guid', 'clientGuid', 'accountGuid']))
    .tolerate(async (err) => {

      err.details = {
        ChatBlastsPerformanceUpdateCriteria,
      };

      await sails.helpers.general.throwErrorJoi({
        errorType: sails.config.custom.enums.errorType.CRITICAL,
        emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
        requestId,
        childRequestId,
        location: `${moduleName}::${methodName}`,
        message: sails.config.custom.CHAT_BLASTS_ERROR_PERFORMANCE_REC_UPDATE_ERROR.message,
        errorName: sails.config.custom.CHAT_BLASTS_ERROR_PERFORMANCE_REC_UPDATE_ERROR.name,
        payload: {
          ChatBlastsPerformanceUpdateCriteria,
          rec,
          err,
        },
      });

      return 'error';
    });


  /**
   * Если следующий элемент необходимо выполнить немедленно,
   * то запускаем текущий метод рекурсивно
   */

  if (performNextElementNow) {

    await processChatBlastElement(client, rec, nextElem);

  }

}


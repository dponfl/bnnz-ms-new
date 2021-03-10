"use strict";

const Joi = require('@hapi/joi');
const uuid = require('uuid-apikey');
const sleep = require('util').promisify(setTimeout);
const moment = require('moment');

const moduleName = 'push-messages:common:main:callback-pending-tasks-over-limit-joi';


module.exports = {


  friendlyName: 'push-messages:common:main:callback-pending-tasks-over-limit-joi',


  description: 'push-messages:common:main:callback-pending-tasks-over-limit-joi',


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
        .any()
        .description('Client record')
        .required(),
      query: Joi
        .any()
        .description('Callback query received')
        .required(),
    });


    let input;

    let client;
    let clientGuid;
    let accountGuid;

    let checkLikesJoiRaw;
    let checkCommentsJoiRaw;

    let parserStatus = '';
    const parserRequestIntervalsLikes = sails.config.custom.config.parsers.inst.errorSteps.checkLikes.intervals;
    const parserRequestIntervalsComments = sails.config.custom.config.parsers.inst.errorSteps.checkComments.intervals;
    const parserRequestIntervalTime = sails.config.custom.config.parsers.inst.errorSteps.intervalTime;
    const notificationsLikes = _.cloneDeep(sails.config.custom.config.parsers.inst.errorSteps.checkLikes.notifications);
    const notificationsComments = _.cloneDeep(sails.config.custom.config.parsers.inst.errorSteps.checkComments.notifications);

    let activeParserLikes = null;
    let activeParserComments = null;

    const parserPlatformName = 'instagram';
    const parserModuleNameLikes = 'checkLikes';
    const parserModuleNameComments = 'checkComments';

    let momentStart;
    let iLikes;
    let iComments;

    let pushMessage;
    let pushMessageName;
    let pushMessageGetParams;
    let pushMessageGetRaw;
    let messageDataPath;
    let messageData;

    let pendingTasks;

    let checkLikesList = [];
    let checkCommentsList = [];

    let instProfile;

    try {

      input = await schema.validateAsync(inputs.params);

      client = input.client;

      clientGuid = client.guid;
      accountGuid = client.account_use;

      const currentAccount = _.find(client.accounts, {guid: client.account_use});

      instProfile = currentAccount.inst_profile;

      /**
       * Достаём данные PushMessage
       */

      pushMessageName = currentAccount.service.push_message_name;

      pushMessageGetParams = {
        pushMessageName,
      };

      pushMessageGetRaw = await sails.helpers.storage.pushMessageGetJoi(pushMessageGetParams);

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

      /**
       * Отправляем сообщение, что начинаем проверку заданий
       */


      messageDataPath = 'keyboards.main.pending_tasks_search';
      messageData = _.get(pushMessage, messageDataPath, null);

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

      await sails.helpers.messageProcessor.sendMessageJoi({
        client,
        messageData,
      });


      /**
       * Получаем список невыполненных заданий на текущий момент
       */

      const pendingTasksGetParams = {
        or: [
          {
            accountGuid,
            makeLike: true,
            makeLikePerformed: false,
          },
          {
            accountGuid,
            makeComment: true,
            makeCommentPerformed: false,
          }
        ]
      }

      pendingTasks = await Tasks.find(pendingTasksGetParams)
        .tolerate(async (err) => {

          err.details = pendingTasksGetParams;

          await LogProcessor.dbError({
            error: err,
            message: 'Tasks.find() error',
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: pendingTasksGetParams,
          });

          return null;
        });

      if (pendingTasks == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Tasks.find() error',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.DB_ERROR_MEDIUM.name,
          payload: pendingTasksGetParams,
        });
      }

      if (pendingTasks.length > 0) {

        for (const pendingTask of pendingTasks) {

          /**
           * Добавляем в структуру задач информацию о параметрах shortCode & mediaId
           * из таблицы Posts
           */

          /**
           * Вытаскиваем данные поста
           */

          const postRecRaw = await sails.helpers.storage.postsGetJoi({guid: pendingTask.postGuid});

          if (
            _.isArray(postRecRaw.payload)
            && postRecRaw.payload.length === 0
          ) {
            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.ERROR,
              location: moduleName,
              message: 'No post found for this guid',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
              payload: {
                taskRecPostGuid: pendingTask.postGuid,
                postRecRaw,
              },
            });
          }

          if (postRecRaw.payload.length !== 1) {
            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.ERROR,
              location: moduleName,
              message: 'More than one record for this guid',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
              payload: {
                taskRecPostGuid: pendingTask.postGuid,
                postRecRaw,
              },
            });
          }

          const postRec = postRecRaw.payload[0];

          _.assign(pendingTask, {postRec});

          /**
           * Формируем список для проверки лайков
           */

          if (pendingTask.makeLike && !pendingTask.makeLikePerformed) {
            checkLikesList.push(pendingTask);
          }

          /**
           * Формируем список для проверки комментариев
           */

          if (pendingTask.makeComment && !pendingTask.makeCommentPerformed) {
            checkCommentsList.push(pendingTask);
          }

        }


        notificationsLikes.map((item) => {
          item.clientNotified = false;
          item.adminNotified = false;
        });

        notificationsComments.map((item) => {
          item.clientNotified = false;
          item.adminNotified = false;
        });

        /**
         * Проверяем парсером каждое задание из списка для проверки лайков
         */

        /**
         * Получаем имя парсера
         */

        const getParserParamsLikes = {
          platformName: parserPlatformName,
          moduleName: parserModuleNameLikes,
        };

        activeParserLikes = await sails.helpers.parsers.getParserJoi(getParserParamsLikes);

        for (const checkLike of checkLikesList) {

          const checkLikesParams = {
            client,
            instProfile,
            shortCode: checkLike.postRec.shortCode,
            postMediaId: checkLike.postRec.mediaId,
          };

          iLikes = 0;

          momentStart = moment();

          while (parserStatus !== 'success' && iLikes < parserRequestIntervalsLikes.length) {

            if (activeParserLikes != null) {

              checkLikesJoiRaw = await sails.helpers.parsers.inst[activeParserLikes].checkLikesJoi(checkLikesParams);

              parserStatus = checkLikesJoiRaw.status;

            } else {

              parserStatus = 'error';

            }

            if (parserStatus !== 'success') {

              if (activeParserLikes != null) {

                /**
                 * выставляем флаг, что парсер неактивен
                 */

                const apiStatusUpdateParams = {
                  platformName: parserPlatformName,
                  moduleName: parserModuleNameLikes,
                  parserName: activeParserLikes,
                  data: {
                    key: 'active',
                    value: false,
                  },
                  createdBy: moduleName,
                };

                await sails.helpers.storage.apiStatusUpdateJoi(apiStatusUpdateParams);

              }


              /**
               * Проверяем условие отправки информационного сообщения клиенту
               * и логируем факт факапа парсера с фиксацией текущего интервала
               */

              const momentNow = moment();

              const requestDuration = moment.duration(momentNow.diff(momentStart)).asMilliseconds();

              for (const likeErrorNotification of notificationsLikes) {

                if (requestDuration > likeErrorNotification.notificationInterval * parserRequestIntervalTime) {

                  if (likeErrorNotification.sendMessageToClient && !likeErrorNotification.clientNotified) {

                    /**
                     * Информируем клиента при факапе API парсера
                     */

                    messageDataPath = 'keyboards.main.pending_tasks_parser_error';
                    messageData = _.get(pushMessage, messageDataPath, null);

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

                    await sails.helpers.messageProcessor.sendMessageJoi({
                      client: input.client,
                      messageData,
                    });

                    likeErrorNotification.clientNotified = true;

                  }

                  if (likeErrorNotification.sendMessageToAdmin && !likeErrorNotification.adminNotified) {

                    /**
                     * Генерим сообщение о критической ошибке
                     */

                    await LogProcessor.critical({
                      message: sails.config.custom.INST_PARSER_CHECK_LIKES_ERROR.message,
                      clientGuid,
                      accountGuid,
                      // requestId: null,
                      // childRequestId: null,
                      errorName: sails.config.custom.INST_PARSER_CHECK_LIKES_ERROR.name,
                      location: moduleName,
                      emergencyLevel: likeErrorNotification.emergencyLevel,
                      payload: {
                        notificationInterval: `${likeErrorNotification.notificationInterval} seconds`,
                        activeParserLikes,
                      },
                    });

                    likeErrorNotification.adminNotified = true;

                  }

                }

              }

              await sleep(parserRequestIntervalsLikes[iLikes] * parserRequestIntervalTime);

              activeParserLikes = await sails.helpers.parsers.getParserJoi(getParserParamsLikes);

            }

            iLikes++;

          }

          if (parserStatus !== 'success') {

            /**
             * Корректный ответ от парсера так и НЕ БЫЛ ПОЛУЧЕН
             */

            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
              location: moduleName,
              message: 'Likes check: Successful response WAS NOT RECEIVED from parser',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
              payload: {},
            });

          }

          const likeDone = _.get(checkLikesJoiRaw, 'payload.likeMade', 'none');

          if (likeDone === 'none') {
            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.ERROR,
              location: moduleName,
              message: 'Wrong checkLikesJoi response: no payload.likeMade',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
              payload: {
                checkLikesParams,
                checkLikesJoiRaw,
              },
            });
          }

          if (likeDone) {

            checkLike.makeLikePerformed = true;
            checkLike.postRec.receivedLikes++;
            checkLike.postRec.allLikesDone = checkLike.postRec.receivedLikes >= checkLike.postRec.requestedLikes;

          }

          /**
           * Используем DB lock
           */

          const lockTimeOut = sails.config.custom.config.db.lockTimeOut || 600;

          const sqlGetLockPerformTask = `
    SELECT GET_LOCK('performTasksLock', ${lockTimeOut}) as getPerformTaskLockResult
    `;

          const sqlReleaseLockPerformTask = `
    SELECT RELEASE_LOCK('performTasksLock') as releasePerformTaskLockResult
    `;

          await sails.getDatastore('clientDb')
            .leaseConnection(async (db) => {

              try {

                const resGetLock = await sails
                  .sendNativeQuery(sqlGetLockPerformTask)
                  .usingConnection(db);

                const getLockRes = _.get(resGetLock, 'rows[0].getPerformTaskLockResult', null);

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
                 * Обновляем записи в таблицах Tasks & Posts
                 */

                await sails.helpers.storage.tasksUpdateJoi({
                  criteria: {
                    guid: checkLike.guid,
                  },
                  data: {
                    makeLikePerformed: checkLike.makeLikePerformed,
                  },
                });

                await sails.helpers.storage.postsUpdateJoi({
                  criteria: {
                    guid: checkLike.postRec.guid,
                  },
                  data: {
                    receivedLikes: checkLike.postRec.receivedLikes,
                    allLikesDone: checkLike.postRec.allLikesDone,
                  },
                });

                /**
                 * Обновляем запись в таблице Account
                 */

                await sails.helpers.storage.accountUpdateJoi({
                  criteria: {guid: currentAccount.guid},
                  data: {
                    made_likes_day: likeDone
                      ? ++currentAccount.made_likes_day
                      : currentAccount.made_likes_day,
                    made_likes_total: likeDone
                      ? ++currentAccount.made_likes_total
                      : currentAccount.made_likes_total,
                  },
                  createdBy: moduleName,
                });

                const ReleaseLock = await sails
                  .sendNativeQuery(sqlReleaseLockPerformTask)
                  .usingConnection(db);

                const releaseLockRes = _.get(ReleaseLock, 'rows[0].releasePerformTaskLockResult', null);

                if (releaseLockRes == null) {
                  await LogProcessor.critical({
                    message: sails.config.custom.DB_ERROR_RELEASE_LOCK_WRONG_RESPONSE.message,
                    clientGuid,
                    accountGuid,
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
                    clientGuid,
                    accountGuid,
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
                  .sendNativeQuery(sqlReleaseLockPerformTask)
                  .usingConnection(db);

                const releaseLockRes = _.get(ReleaseLock, 'rows[0].releasePerformTaskLockResult', null);

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

        }

        /**
         * Проверяем парсером каждое задание из списка для проверки комментариев
         */

        /**
         * Получаем имя парсера
         */

        const getParserParamsComments = {
          platformName: parserPlatformName,
          moduleName: parserModuleNameComments,
        };

        activeParserComments = await sails.helpers.parsers.getParserJoi(getParserParamsComments);

        parserStatus = '';

        for (const checkComment of checkCommentsList) {

          const checkCommentsParams = {
            client,
            instProfile,
            shortCode: checkComment.postRec.shortCode,
            postMediaId: checkComment.postRec.mediaId,
          };

          iComments = 0;

          momentStart = moment();

          while (parserStatus !== 'success' && iComments < parserRequestIntervalsComments.length) {

            if (activeParserComments != null) {

              checkCommentsJoiRaw = await sails.helpers.parsers.inst[activeParserComments].checkCommentsJoi(checkCommentsParams);

              parserStatus = checkCommentsJoiRaw.status;

            } else {

              parserStatus = 'error';

            }


            if (parserStatus !== 'success') {

              if (activeParserComments != null) {

                /**
                 * выставляем флаг, что парсер неактивен
                 */

                const apiStatusUpdateParams = {
                  platformName: parserPlatformName,
                  moduleName: parserModuleNameComments,
                  parserName: activeParserComments,
                  data: {
                    key: 'active',
                    value: false,
                  },
                  createdBy: moduleName,
                };

                await sails.helpers.storage.apiStatusUpdateJoi(apiStatusUpdateParams);

              }

              /**
               * Проверяем условие отправки информационного сообщения клиенту
               * и логируем факт факапа парсера с фиксацией текущего интервала
               */

              const momentNow = moment();

              const requestDuration = moment.duration(momentNow.diff(momentStart)).asMilliseconds();

              for (const commentErrorNotification of notificationsComments) {

                if (requestDuration > commentErrorNotification.notificationInterval * parserRequestIntervalTime) {

                  if (commentErrorNotification.sendMessageToClient && !commentErrorNotification.clientNotified) {

                    /**
                     * Информируем клиента при факапе API парсера
                     */

                    messageDataPath = 'keyboards.main.pending_tasks_parser_error';
                    messageData = _.get(pushMessage, messageDataPath, null);

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

                    await sails.helpers.messageProcessor.sendMessageJoi({
                      client: input.client,
                      messageData,
                    });

                    commentErrorNotification.clientNotified = true;

                  }

                  if (commentErrorNotification.sendMessageToAdmin && !commentErrorNotification.adminNotified) {

                    /**
                     * Генерим сообщение о критической ошибке
                     */

                    await LogProcessor.critical({
                      message: sails.config.custom.INST_PARSER_CHECK_COMMENTS_ERROR.message,
                      clientGuid,
                      accountGuid,
                      // requestId: null,
                      // childRequestId: null,
                      errorName: sails.config.custom.INST_PARSER_CHECK_COMMENTS_ERROR.name,
                      location: moduleName,
                      emergencyLevel: commentErrorNotification.emergencyLevel,
                      payload: {
                        notificationInterval: `${commentErrorNotification.notificationInterval} seconds`,
                        activeParserComments,
                      },
                    });

                    commentErrorNotification.adminNotified = true;

                  }

                }
              }

              await sleep(parserRequestIntervalsComments[iComments] * parserRequestIntervalTime);

              activeParserComments = await sails.helpers.parsers.getParserJoi(getParserParamsComments);

            }

            iComments++;

          }

          if (parserStatus !== 'success') {

            /**
             * Корректный ответ от парсера так и НЕ БЫЛ ПОЛУЧЕН
             */

            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
              location: moduleName,
              message: 'Comments check: Successful response WAS NOT RECEIVED from parser',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
              payload: {},
            });


          }

          const commentDone = _.get(checkCommentsJoiRaw, 'payload.commentMade', 'none');
          const commentText = _.get(checkCommentsJoiRaw, 'payload.commentText', 'none');
          const numberOfWords = _.get(checkCommentsJoiRaw, 'payload.numberOfWords', 'none');

          if (
            commentDone === 'none'
            || commentText === 'none'
            || numberOfWords === 'none'
          ) {
            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.ERROR,
              location: moduleName,
              message: 'Wrong checkCommentsJoi data in response',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
              payload: {
                checkCommentsParams,
                checkCommentsJoiRaw,
              },
            });
          }

          if (commentDone) {

            checkComment.makeCommentPerformed = true;
            checkComment.commentText = await MessageProcessor.clearStr(commentText);
            checkComment.commentNumberOfWords = numberOfWords;
            checkComment.postRec.receivedComments++;
            checkComment.postRec.allCommentsDone = checkComment.postRec.receivedComments >= checkComment.postRec.requestedComments;

          }

          /**
           * Используем DB lock
           */

          const lockTimeOut = sails.config.custom.config.db.lockTimeOut || 600;

          const sqlGetLockPerformTask = `
    SELECT GET_LOCK('performTasksLock', ${lockTimeOut}) as getPerformTaskLockResult
    `;

          const sqlReleaseLockPerformTask = `
    SELECT RELEASE_LOCK('performTasksLock') as releasePerformTaskLockResult
    `;

          await sails.getDatastore('clientDb')
            .leaseConnection(async (db) => {

              try {

                const resGetLock = await sails
                  .sendNativeQuery(sqlGetLockPerformTask)
                  .usingConnection(db);

                const getLockRes = _.get(resGetLock, 'rows[0].getPerformTaskLockResult', null);

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
                 * Обновляем записи в таблицах Tasks & Posts
                 */

                await sails.helpers.storage.tasksUpdateJoi({
                  criteria: {
                    guid: checkComment.guid,
                  },
                  data: {
                    makeCommentPerformed: checkComment.makeCommentPerformed,
                    commentText: checkComment.commentText,
                    commentNumberOfWords: checkComment.commentNumberOfWords,
                  },
                });

                await sails.helpers.storage.postsUpdateJoi({
                  criteria: {
                    guid: checkComment.postRec.guid,
                  },
                  data: {
                    receivedComments: checkComment.postRec.receivedComments,
                    allCommentsDone: checkComment.postRec.allCommentsDone,
                  },
                });

                /**
                 * Обновляем запись в таблице Account
                 */

                await sails.helpers.storage.accountUpdateJoi({
                  criteria: {guid: currentAccount.guid},
                  data: {
                    made_comments_day: commentDone
                      ? ++currentAccount.made_comments_day
                      : currentAccount.made_comments_day,
                    made_comments_total: commentDone
                      ? ++currentAccount.made_comments_total
                      : currentAccount.made_comments_total,
                  },
                  createdBy: moduleName,
                });

                const ReleaseLock = await sails
                  .sendNativeQuery(sqlReleaseLockPerformTask)
                  .usingConnection(db);

                const releaseLockRes = _.get(ReleaseLock, 'rows[0].releasePerformTaskLockResult', null);

                if (releaseLockRes == null) {
                  await LogProcessor.critical({
                    message: sails.config.custom.DB_ERROR_RELEASE_LOCK_WRONG_RESPONSE.message,
                    clientGuid,
                    accountGuid,
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
                    clientGuid,
                    accountGuid,
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
                  .sendNativeQuery(sqlReleaseLockPerformTask)
                  .usingConnection(db);

                const releaseLockRes = _.get(ReleaseLock, 'rows[0].releasePerformTaskLockResult', null);

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

        }



        /**
         * Повторно проверяем наличие невыполненных заданий для аккаунта
         */


        pendingTasks = await Tasks.find(pendingTasksGetParams)
          .tolerate(async (err) => {

            err.details = pendingTasksGetParams;

            await LogProcessor.dbError({
              error: err,
              message: 'Tasks.find() error',
              clientGuid,
              accountGuid,
              // requestId: null,
              // childRequestId: null,
              location: moduleName,
              payload: pendingTasksGetParams,
            });

            return null;
          });

        if (pendingTasks == null) {
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'Tasks.find() error',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.DB_ERROR_MEDIUM.name,
            payload: pendingTasksGetParams,
          });
        }

        const pendingTaskLimit = sails.config.custom.config.tasks.max_pending_tasks_before_post_blocking[currentAccount.service.name];

        if (pendingTaskLimit == null) {
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
            location: moduleName,
            message: 'Cannot find pending tasks limit',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.GENERAL_ERROR.name,
            payload: {
              serviceName: currentAccount.service.name,
              maxPendingTasksLimits: sails.config.custom.config.tasks.max_pending_tasks_before_post_blocking,
            },
          });
        }

        /**
         * Если pendingTaskLimit === 0 значит лимиты проверять не нужно
         * (например для звёзд)
         */

        if (pendingTaskLimit > 0 && pendingTasks.length >= pendingTaskLimit) {

          /**
           * Отправляем сообщение, что есть невыполненные задания
           */

          const beforeHelperParams = pendingTasks;

          const messageDataPath = 'keyboards.main.pending_tasks_over_limit_main';
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

          await sails.helpers.messageProcessor.sendMessageJoi({
            client,
            messageData,
            beforeHelperParams,
            disableWebPagePreview: true,
          });


        } else {

          /**
           * Отправляем сообщение, что нет невыполненных заданий
           */

          messageDataPath = 'keyboards.main.pending_tasks_over_limit_done';
          messageData = _.get(pushMessage, messageDataPath, null);

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

          await sails.helpers.messageProcessor.sendMessageJoi({
            client,
            messageData,
          });

        }

      } else {

        /**
         * Отправляем сообщение, что нет невыполненных заданий
         */

        messageDataPath = 'keyboards.main.no_pending_tasks';
        messageData = _.get(pushMessage, messageDataPath, null);

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

        await sails.helpers.messageProcessor.sendMessageJoi({
          client,
          messageData,
        });

      }















      return exits.success({
        status: 'ok',
        message: 'callbackPendingTasks performed',
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


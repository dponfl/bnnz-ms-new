"use strict";

const Joi = require('@hapi/joi');
const uuid = require('uuid-apikey');
const sleep = require('util').promisify(setTimeout);
const moment = require('moment');

const moduleName = 'push-messages:tasks:callback-likes-comments-joi';


module.exports = {


  friendlyName: 'push-messages:tasks:callback-likes-comments-joi',


  description: 'Обработка callback сообщения, полученного при нажатии кнопки в задании на лайки и комменты',


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

    let activeParser = null;
    const parserPlatformName = 'instagram';
    const parserModuleNameLikes = 'checkLikes';
    const parserModuleNameComments = 'checkComments';

    let momentStart;
    let i;

    let pushMessage;

    try {

      let taskPerformRes;

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      const queryMessageId = _.get(input.query, 'message.message_id', null);

      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});

      const client = input.client;

      const queryDataRegExp = /push_msg_tsk_lc_(\S+)/;

      const queryData = queryDataRegExp.exec(input.query.data);

      if (queryData == null || queryData.length !== 2) {
        // throw new Error(`${moduleName}, Error: query.data has wrong format: ${input.query.data}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'query.data has wrong format',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
          payload: {
            queryData: input.query.data,
          },
        });

      }

      const taskGuid = queryData[1];

      if (!uuid.isUUID(taskGuid)) {
        // throw new Error(`${moduleName}, Error: query.data task code is not a guid: ${taskGuid}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'query.data task code is not a guid',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
          payload: {
            taskGuid,
          },
        });

      }

      /**
       * Получаем информацию по заданию
       */

      const taskRecRaw = await sails.helpers.storage.tasksGetJoi({
        guid: taskGuid,
      });

      if (taskRecRaw.payload.length > 1) {
        // throw new Error(`${moduleName}, Error: Several tasks with the same guid:
        // guid: ${taskGuid}
        // tasks: ${JSON.stringify(taskRecRaw.payload, null, 3)}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Several tasks with the same guid',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
          payload: {
            taskGuid,
            taskRecRaw,
          },
        });

      }

      if (taskRecRaw.payload.length === 0) {
        // throw new Error(`${moduleName}, Error: No tasks for this guid: ${taskGuid}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'No tasks for this guid',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
          payload: {
            taskGuid,
          },
        });

      }

      const taskRec = taskRecRaw.payload[0];

      const {messageId} = await sails.helpers.general.getMessageGuidOrIdJoi({messageGuid: taskRec.messageGuid});

      const account = _.find(input.client.accounts, {guid: taskRec.accountGuid});

      if (account == null) {
        // throw new Error(`${moduleName}, Error: No account found for this guid: ${taskRec.accountGuid}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'No account found for this guid',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
          payload: {
            taskRecAccountGuid: taskRec.accountGuid,
          },
        });

      }

      const instProfile = account.inst_profile;

      const postRecRaw = await sails.helpers.storage.postsGetJoi({guid: taskRec.postGuid});

      if (
        _.isArray(postRecRaw.payload)
        && postRecRaw.payload.length === 0
      ) {
        // throw new Error(`${moduleName}, Error: No post found for this guid: ${taskRec.postGuid}, res: \n${JSON.stringify(postRecRaw, null, 3)}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'No post found for this guid',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
          payload: {
            taskRecPostGuid: taskRec.postGuid,
            postRecRaw,
          },
        });

      }

      if (postRecRaw.payload.length !== 1) {
        // throw new Error(`${moduleName}, Error: More than one record for this guid: ${taskRec.postGuid}, res: \n${JSON.stringify(postRecRaw, null, 3)}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'More than one record for this guid',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
          payload: {
            taskRecPostGuid: taskRec.postGuid,
            postRecRaw,
          },
        });

      }

      const postRec = postRecRaw.payload[0];

      const postMediaId = postRec.mediaId;
      const shortCode = postRec.shortCode;

      /**
       * Отправляем сообщение, что начинаем проверку задания и убираем кнопку проверки задания
       */

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

      const messageDataPath = 'tasks.onCheckButtonPressed';
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

      taskPerformRes = await sails.helpers.messageProcessor.sendMessageJoi({
        client: input.client,
        messageData,
        additionalTokens: [
          {
            token: '$PostLink$',
            value: postRec.postLink,
          },
        ],
        additionalParams: {
          chat_id: input.client.chat_id,
          message_id: messageId || queryMessageId,
          disable_web_page_preview: true,
        },
      });


      /**
       * Проверка выполнения задания с использванием парсера
       */

      /**
       * Получаем имя парсера
       */

      const getParserParamsLikes = {
        platformName: parserPlatformName,
        moduleName: parserModuleNameLikes,
      };

      activeParser = await sails.helpers.parsers.getParserJoi(getParserParamsLikes);

      notificationsLikes.map((item) => {
        item.clientNotified = false;
        item.adminNotified = false;
      });

      notificationsComments.map((item) => {
        item.clientNotified = false;
        item.adminNotified = false;
      });


      /**
       * Проверяем лайки
       */

      const checkLikesParams = {
        client,
        instProfile,
        shortCode,
        postMediaId,
      };

      i = 0;

      momentStart = moment();

      while (parserStatus !== 'success' && i < parserRequestIntervalsLikes.length) {

        if (activeParser != null) {

          checkLikesJoiRaw = await sails.helpers.parsers.inst[activeParser].checkLikesJoi(checkLikesParams);

          parserStatus = checkLikesJoiRaw.status;

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
              moduleName: parserModuleNameLikes,
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
           * Проверяем условие отправки информационного сообщения клиенту
           * и логируем факт факапа парсера с фиксацией текущего интервала
           */

          const momentNow = moment();

          const requestDuration = moment.duration(momentNow.diff(momentStart)).asMilliseconds();

          for (const likeErrorNotification of notificationsLikes) {

            if (requestDuration > likeErrorNotification.notificationInterval * parserRequestIntervalTime) {

              if (likeErrorNotification.sendMessageToClient && !likeErrorNotification.clientNotified) {

                /**
                 * Трансформируем блок в информационное сообщение о факапе API
                 */

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

                const messageDataPath = 'tasks.onParserError';
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

                taskPerformRes = await sails.helpers.messageProcessor.sendMessageJoi({
                  client: input.client,
                  messageData,
                  additionalTokens: [
                    {
                      token: '$PostLink$',
                      value: postRec.postLink,
                    },
                  ],
                  additionalParams: {
                    chat_id: input.client.chat_id,
                    message_id: messageId || queryMessageId,
                    disable_web_page_preview: true,
                  },
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
                    activeParser,
                  },
                });

                likeErrorNotification.adminNotified = true;

              }

            }

          }

          await sleep(parserRequestIntervalsLikes[i] * parserRequestIntervalTime);

          activeParser = await sails.helpers.parsers.getParserJoi(getParserParamsLikes);

        }

        i++;

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
        // throw new Error(`${moduleName}, error: wrong checkLikesJoi response: no payload.likeMade
        // checkLikesParams: ${JSON.stringify(checkLikesParams, null, 3)}
        // checkLikesJoiRaw: ${JSON.stringify(checkLikesJoiRaw, null, 3)}`);

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

      parserStatus = '';

      /**
       * Проверяем комменты
       */

      /**
       * Получаем имя парсера
       */

      const getParserParamsComments = {
        platformName: parserPlatformName,
        moduleName: parserModuleNameComments,
      };

      activeParser = await sails.helpers.parsers.getParserJoi(getParserParamsComments);

      const checkCommentsParams = {
        client,
        instProfile,
        shortCode,
        postMediaId,
      };

      i = 0;

      momentStart = moment();

      while (parserStatus !== 'success' && i < parserRequestIntervalsComments.length) {

        if (activeParser != null) {

          checkCommentsJoiRaw = await sails.helpers.parsers.inst[activeParser].checkCommentsJoi(checkCommentsParams);

          parserStatus = checkCommentsJoiRaw.status;

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
              moduleName: parserModuleNameComments,
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
           * Проверяем условие отправки информационного сообщения клиенту
           * и логируем факт факапа парсера с фиксацией текущего интервала
           */

          const momentNow = moment();

          const requestDuration = moment.duration(momentNow.diff(momentStart)).asMilliseconds();

          for (const commentErrorNotification of notificationsComments) {

            if (requestDuration > commentErrorNotification.notificationInterval * parserRequestIntervalTime) {

              if (commentErrorNotification.sendMessageToClient && !commentErrorNotification.clientNotified) {

                /**
                 * Трансформируем блок в информационное сообщение о факапе API
                 */

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

                const messageDataPath = 'tasks.onParserError';
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

                taskPerformRes = await sails.helpers.messageProcessor.sendMessageJoi({
                  client: input.client,
                  messageData,
                  additionalTokens: [
                    {
                      token: '$PostLink$',
                      value: postRec.postLink,
                    },
                  ],
                  additionalParams: {
                    chat_id: input.client.chat_id,
                    message_id: messageId || queryMessageId,
                    disable_web_page_preview: true,
                  },
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
                    activeParser,
                  },
                });

                commentErrorNotification.adminNotified = true;

              }

            }
          }

          await sleep(parserRequestIntervalsComments[i] * parserRequestIntervalTime);

          activeParser = await sails.helpers.parsers.getParserJoi(getParserParamsComments);

        }

        i++;

      }

      if (parserStatus !== 'success') {

        /**
         * Корректный ответ от парсера так и НЕ БЫЛ ПОЛУЧЕН
         */

        // sails.log.error(`${moduleName}: Comments check: Успешный ответ от парсера так и не был получен`);
        //
        // throw new Error(`${moduleName}: Comments check: Успешный ответ от парсера так и не был получен`);

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
        // throw new Error(`${moduleName}, error: wrong checkCommentsJoi data in response
        // checkCommentsParams: ${JSON.stringify(checkCommentsParams, null, 3)}
        // checkCommentsJoiRaw: ${JSON.stringify(checkCommentsJoiRaw, null, 3)}`);

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

      let taskData = {
        makeLikePerformed: taskRec.makeLikePerformed,
        makeCommentPerformed: taskRec.makeCommentPerformed,
      };

      let postData = {
        receivedLikes: postRec.receivedLikes,
        receivedComments: postRec.receivedComments,
        allLikesDone: postRec.allLikesDone,
        allCommentsDone: postRec.allCommentsDone,
      };

      if (likeDone) {

        taskData.makeLikePerformed = true;
        postData.receivedLikes++;
        postData.allLikesDone = postData.receivedLikes >= postRec.requestedLikes;

      }

      if (commentDone) {

        taskData.makeCommentPerformed = true;
        taskData.commentText = await MessageProcessor.clearStr(commentText);
        taskData.commentNumberOfWords = numberOfWords;
        postData.receivedComments++;
        postData.allCommentsDone = postData.receivedComments >= postRec.requestedComments;

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

            if (likeDone || commentDone) {

              /**
               * Обновляем записи в таблицах Tasks & Posts
               */

              await sails.helpers.storage.tasksUpdateJoi({
                criteria: {
                  guid: taskRec.guid,
                },
                data: taskData,
              });

              await sails.helpers.storage.postsUpdateJoi({
                criteria: {
                  guid: postRec.guid,
                },
                data: postData,
              });

              /**
               * Обновляем запись в таблице Account
               */

              await sails.helpers.storage.accountUpdateJoi({
                criteria: {guid: account.guid},
                data: {
                  made_likes_day: likeDone
                    ? ++account.made_likes_day
                    : account.made_likes_day,
                  made_likes_total: likeDone
                    ? ++account.made_likes_total
                    : account.made_likes_total,
                  made_comments_day: commentDone
                    ? ++account.made_comments_day
                    : account.made_comments_day,
                  made_comments_total: commentDone
                    ? ++account.made_comments_total
                    : account.made_comments_total,
                },
                createdBy: moduleName,
              });

            }

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


      if (taskRec.messageId != null
      || queryMessageId != null) {

        /**
         * При полностью выполненном задании (лайк + коммент):
         * трансформируем в чате аккаунта сообщение с требованием выполнить задание в сообщение,
         * что задание успешно выполнено
         */

        if (likeDone && commentDone) {

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

          const messageDataPath = 'tasks.likes_comments_done';
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

          taskPerformRes = await sails.helpers.messageProcessor.sendMessageJoi({
            client: input.client,
            messageData,
            additionalTokens: [
              {
                token: '$PostLink$',
                value: postRec.postLink,
              },
            ],
            additionalParams: {
              chat_id: input.client.chat_id,
              message_id: messageId || queryMessageId,
              disable_web_page_preview: true,
            },
          });

        }

        /**
         * При полностью невыполненном задании (нет ни лайка ни коммента):
         * трансформируем в чате аккаунта сообщение с требованием выполнить
         * задание в сообщение, что задание не было выполнено
         */

        if (!likeDone && !commentDone) {

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

          const messageDataPath = 'tasks.likes_comments_not_done';
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

          messageData.message.inline_keyboard[1] = [
            {
              "text": "COMMON_MSG_TASK_PERFORM_BTN",
              "callback_data": "push_msg_tsk_lc_" + taskRec.guid
            }
          ];

          taskPerformRes = await sails.helpers.messageProcessor.sendMessageJoi({
            client: input.client,
            messageData,
            additionalTokens: [
              {
                token: '$PostLink$',
                value: postRec.postLink,
              },
            ],
            additionalParams: {
              chat_id: input.client.chat_id,
              message_id: messageId || queryMessageId,
              disable_web_page_preview: true,
            },
          });

        }

        /**
         * При частично выполненном задании (только лайк):
         * трансформируем в чате аккаунта сообщение с требованием выполнить задание в
         * сообщение, что задание было выполнено не полностью и необходимо оставить комментарий
         */

        if (likeDone && !commentDone) {

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

          const messageDataPath = 'tasks.likes_comments_no_comment';
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

          messageData.message.inline_keyboard[1] = [
            {
              "text": "COMMON_MSG_TASK_PERFORM_BTN",
              "callback_data": "push_msg_tsk_lc_" + taskRec.guid
            }
          ];

          taskPerformRes = await sails.helpers.messageProcessor.sendMessageJoi({
            client: input.client,
            messageData,
            additionalTokens: [
              {
                token: '$PostLink$',
                value: postRec.postLink,
              },
            ],
            additionalParams: {
              chat_id: input.client.chat_id,
              message_id: messageId || queryMessageId,
              disable_web_page_preview: true,
            },
          });

        }

        /**
         * При частично выполненном задании (только комментарий):
         * трансформируем в чате аккаунта сообщение с требованием выполнить задание в
         * сообщение, что задание было выполнено не полностью и необходимо поставить лайк
         */

        if (!likeDone && commentDone) {

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

          const messageDataPath = 'tasks.likes_comments_no_like';
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

          messageData.message.inline_keyboard[1] = [
            {
              "text": "COMMON_MSG_TASK_PERFORM_BTN",
              "callback_data": "push_msg_tsk_lc_" + taskRec.guid
            }
          ];

          taskPerformRes = await sails.helpers.messageProcessor.sendMessageJoi({
            client: input.client,
            messageData,
            additionalTokens: [
              {
                token: '$PostLink$',
                value: postRec.postLink,
              },
            ],
            additionalParams: {
              chat_id: input.client.chat_id,
              message_id: messageId || queryMessageId,
              disable_web_page_preview: true,
            },
          });

        }

      }

      return exits.success({
        status: 'ok',
        message: 'callbackLikesComments performed',
        payload: {
          res: taskPerformRes,
        },
      })

    } catch (e) {
      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          clientGuid,
          accountGuid,
          error: e,
          location: moduleName,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          clientGuid,
          accountGuid,
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


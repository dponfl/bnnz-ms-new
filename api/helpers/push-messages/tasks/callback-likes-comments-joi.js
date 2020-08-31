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
    let taskPerformRes;

    let parserStatus = '';
    const parserRequestIntervalsLikes = sails.config.custom.config.parsers.inst.errorSteps.checkLikes.intervals;
    const notificationIntervalLikes = sails.config.custom.config.parsers.inst.errorSteps.checkLikes.notificationInterval;
    const parserRequestIntervalsComments = sails.config.custom.config.parsers.inst.errorSteps.checkComments.intervals;
    const notificationIntervalComments = sails.config.custom.config.parsers.inst.errorSteps.checkComments.notificationInterval;
    const parserRequestIntervalTime = sails.config.custom.config.parsers.inst.errorSteps.intervalTime;

    let infoMessageWasSend = false;

    let momentStart;
    let i;

    let pushMessage;

    try {

      let taskPerformRes;

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

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

      const postLink = postRec.postLink;

      const instPostCode = await sails.helpers.general.getPostCodeJoi({postLink});

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
          message_id: taskRec.messageId,
          disable_web_page_preview: true,
        },
      });


      /**
       * Проверка выполнения задания с использванием парсера
       */

      const activeParser = sails.config.custom.config.parsers.inst.activeParserName;

      /**
       * Проверяем лайки
       */

      const checkLikesParams = {
        client,
        instProfile,
        instPostCode,
      };

      i = 0;

      momentStart = moment();

      while (parserStatus !== 'success' && i < parserRequestIntervalsLikes.length) {

        checkLikesJoiRaw = await sails.helpers.parsers.inst[activeParser].checkLikesJoi(checkLikesParams);

        parserStatus = checkLikesJoiRaw.status;

        if (parserStatus !== 'success') {

          /**
           * Проверяем условие отправки информационного сообщения клиенту
           * и логируем факт факапа парсера с фиксацией текущего интервала
           */

          const momentNow = moment();

          const requestDuration = moment.duration(momentNow.diff(momentStart)).asMilliseconds();

          if (requestDuration > notificationIntervalLikes && !infoMessageWasSend) {

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
                message_id: taskRec.messageId,
                disable_web_page_preview: true,
              },
            });

            infoMessageWasSend = true;

          }

          /**
           * Логируем ошибку парсера
           */

          // TODO: Добавить нормальное логирование деталей ошибки и организовать отправку сообщения админу

          sails.log.error(`${moduleName} Instagram parser error on likes check: enable interval: ${parserRequestIntervalsLikes[i]}`);

          await sleep(parserRequestIntervalsLikes[i] * parserRequestIntervalTime);

        }

        i++;

      }

      if (parserStatus !== 'success') {

        /**
         * Корректный ответ от парсера так и НЕ БЫЛ ПОЛУЧЕН
         */

        // sails.log.error(`${moduleName}: Likes check: Успешный ответ от парсера так и не был получен`);
        //
        // throw new Error(`${moduleName}: Likes check: Успешный ответ от парсера так и не был получен`);

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


      const checkCommentsParams = {
        client,
        instProfile,
        instPostCode,
      };

      i = 0;

      momentStart = moment();

      while (parserStatus !== 'success' && i < parserRequestIntervalsComments.length) {

        checkCommentsJoiRaw = await sails.helpers.parsers.inst[activeParser].checkCommentsJoi(checkCommentsParams);

        parserStatus = checkCommentsJoiRaw.status;

        if (parserStatus !== 'success') {

          /**
           * Проверяем условие отправки информационного сообщения клиенту
           * и логируем факт факапа парсера с фиксацией текущего интервала
           */

          const momentNow = moment();

          const requestDuration = moment.duration(momentNow.diff(momentStart)).asMilliseconds();

          if (requestDuration > notificationIntervalComments && !infoMessageWasSend) {

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
                message_id: taskRec.messageId,
                disable_web_page_preview: true,
              },
            });

            infoMessageWasSend = true;

          }

          /**
           * Логируем ошибку парсера
           */

          // TODO: Добавить нормальное логирование деталей ошибки и организовать отправку сообщения админу

          sails.log.error(`${moduleName} Instagram parser error on comments check: enable interval: ${parserRequestIntervalsComments[i]}`);

          await sleep(parserRequestIntervalsComments[i] * parserRequestIntervalTime);

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

      if (taskRec.messageId != null) {

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
              message_id: taskRec.messageId,
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
              "text": "MSG_TASK_PERFORM_BTN",
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
              message_id: taskRec.messageId,
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
              "text": "MSG_TASK_PERFORM_BTN",
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
              message_id: taskRec.messageId,
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
              "text": "MSG_TASK_PERFORM_BTN",
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
              message_id: taskRec.messageId,
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

      // const errorLocation = moduleName;
      // const errorMsg = `${moduleName}: General error`;
      //
      // sails.log.error(errorLocation + ', error: ' + errorMsg);
      // sails.log.error(errorLocation + ', error details: ', e);
      //
      // throw {err: {
      //     module: errorLocation,
      //     message: errorMsg,
      //     payload: {
      //       error: e,
      //     },
      //   }
      // };

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


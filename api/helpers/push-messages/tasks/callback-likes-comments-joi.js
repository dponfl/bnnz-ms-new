"use strict";

const Joi = require('@hapi/joi');
const uuid = require('uuid-apikey');

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
      // messageData: Joi
      //   .any()
      //   .description('Message data object')
      //   .required(),
      query: Joi
        .any()
        .description('Callback query received')
        .required(),
    });


    try {

      let taskPerformRes;

      const input = await schema.validateAsync(inputs.params);

      const queryDataRegExp = /push_msg_tsk_lc_(\S+)/;

      const queryData = queryDataRegExp.exec(input.query.data);

      if (queryData == null || queryData.length !== 2) {
        throw new Error(`${moduleName}, Error: query.data has wrong format: ${input.query.data}`);
      }

      const taskGuid = queryData[1];

      if (!uuid.isUUID(taskGuid)) {
        throw new Error(`${moduleName}, Error: query.data task code is not a guid: ${taskGuid}`);
      }

      /**
       * Получаем информацию по заданию
       */

      const taskRecRaw = await sails.helpers.storage.tasksGetJoi({
        guid: taskGuid,
      });

      if (taskRecRaw.payload.length > 1) {
        throw new Error(`${moduleName}, Error: Several tasks with the same guid: 
        guid: ${taskGuid}
        tasks: ${JSON.stringify(taskRecRaw.payload, null, 3)}`);
      }

      if (taskRecRaw.payload.length === 0) {
        throw new Error(`${moduleName}, Error: No tasks for this guid: ${taskGuid}`);
      }

      const taskRec = taskRecRaw.payload[0];

      const account = _.find(input.client.accounts, {guid: taskRec.accountGuid});

      if (account == null) {
        throw new Error(`${moduleName}, Error: No account found for this guid: ${taskRec.accountGuid}`);
      }

      const instProfile = account.inst_profile;

      const postRecRaw = await sails.helpers.storage.postsGetJoi({guid: taskRec.postGuid});

      if (
        _.isArray(postRecRaw.payload)
        && postRecRaw.payload.length === 0
      ) {
        throw new Error(`${moduleName}, Error: No post found for this guid: ${taskRec.postGuid}, res: \n${JSON.stringify(postRecRaw, null, 3)}`);
      }

      if (postRecRaw.payload.length !== 1) {
        throw new Error(`${moduleName}, Error: More than one record for this guid: ${taskRec.postGuid}, res: \n${JSON.stringify(postRecRaw, null, 3)}`);
      }

      const postRec = postRecRaw.payload[0];

      const postLink = postRec.postLink;

      const instPostCode = await sails.helpers.general.getPostCodeJoi({postLink});

      /**
       * Проверка выполнения задания с использванием парсера
       */

      const activeParser = sails.config.custom.config.parsers.inst;

      /**
       * Проверяем лайки
       */

      const checkLikesParams = {
        instProfile,
        instPostCode,
      };

      const checkLikesJoiRaw = await sails.helpers.parsers.inst[activeParser].checkLikesJoi(checkLikesParams);

      if (checkLikesJoiRaw.status !== 'ok') {
        throw new Error(`${moduleName}, error: wrong checkLikesJoi response
        checkLikesParams: ${JSON.stringify(checkLikesParams, null, 3)}
        checkLikesJoiRaw: ${JSON.stringify(checkLikesJoiRaw, null, 3)}`);
      }

      const likeDone = _.get(checkLikesJoiRaw, 'payload.likeMade', 'none');

      if (likeDone === 'none') {
        throw new Error(`${moduleName}, error: wrong checkLikesJoi response: no payload.likeMade
        checkLikesParams: ${JSON.stringify(checkLikesParams, null, 3)}
        checkLikesJoiRaw: ${JSON.stringify(checkLikesJoiRaw, null, 3)}`);
      }


      /**
       * Проверяем комменты
       */


      const checkCommentsParams = {
        instProfile,
        instPostCode,
      };

      const checkCommentsJoiRaw = await sails.helpers.parsers.inst[activeParser].checkCommentsJoi(checkCommentsParams);

      if (checkCommentsJoiRaw.status !== 'ok') {
        throw new Error(`${moduleName}, error: wrong checkCommentsJoi response
        checkCommentsParams: ${JSON.stringify(checkCommentsParams, null, 3)}
        checkCommentsJoiRaw: ${JSON.stringify(checkCommentsJoiRaw, null, 3)}`);
      }

      const commentDone = _.get(checkCommentsJoiRaw, 'payload.commentMade', 'none');
      const commentText = _.get(checkCommentsJoiRaw, 'payload.commentText', 'none');
      const numberOfWords = _.get(checkCommentsJoiRaw, 'payload.numberOfWords', 'none');

      if (
        commentDone === 'none'
        || commentText === 'none'
        || numberOfWords === 'none'
      ) {
        throw new Error(`${moduleName}, error: wrong checkCommentsJoi data in response
        checkCommentsParams: ${JSON.stringify(checkCommentsParams, null, 3)}
        checkCommentsJoiRaw: ${JSON.stringify(checkCommentsJoiRaw, null, 3)}`);
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
        taskData.commentText = commentText;
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

          taskPerformRes = await sails.helpers.messageProcessor.sendMessageJoi({
            client: input.client,
            messageData: sails.config.custom.pushMessages.tasks.likes_comments_done[0],
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

          const messageData = sails.config.custom.pushMessages.tasks.likes_comments_not_done[0].message;

          messageData.inline_keyboard = _.concat(messageData.inline_keyboard,
            [
              [
                {
                  "text": "MSG_TASK_PERFORM_BTN",
                  "callback_data": "push_msg_tsk_lc_" + taskRec.guid
                }
              ]
            ]
          );

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

          const messageData = sails.config.custom.pushMessages.tasks.likes_comments_no_comment[0].message;

          messageData.inline_keyboard = _.concat(messageData.inline_keyboard,
            [
              [
                {
                  "text": "MSG_TASK_PERFORM_BTN",
                  "callback_data": "push_msg_tsk_lc_" + taskRec.guid
                }
              ]
            ]
          );

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

          const messageData = sails.config.custom.pushMessages.tasks.likes_comments_no_like[0].message;

          messageData.inline_keyboard = _.concat(messageData.inline_keyboard,
            [
              [
                {
                  "text": "MSG_TASK_PERFORM_BTN",
                  "callback_data": "push_msg_tsk_lc_" + taskRec.guid
                }
              ]
            ]
          );

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

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {
            error: e,
          },
        }
      };

    }

  }

};


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
      messageData: Joi
        .any()
        .description('Message data object')
        .required(),
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

      const likeCommentDone = await sails.helpers.parsers.inst.ninja.checkLikesCommentsJoi({
        instProfile,
        instPostCode,
      });

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

      if (likeCommentDone.likeMade) {

        taskData.makeLikePerformed = true;
        postData.receivedLikes++;
        postData.allLikesDone = postData.receivedLikes >= postRec.requestedLikes;

      }

      if (likeCommentDone.commentMade) {

        taskData.makeCommentPerformed = true;
        taskData.commentText = likeCommentDone.commentText;
        postData.receivedComments++;
        postData.allCommentsDone = postData.receivedComments >= postRec.requestedComments;

      }

      if (likeCommentDone.likeMade || likeCommentDone.commentMade) {

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

      }

      if (taskRec.messageId != null) {

        /**
         * При полностью выполненном задании (лайк + коммент):
         * трансформируем в чате аккаунта сообщение с требованием выполнить задание в сообщение,
         * что задание успешно выполнено
         */

        if (likeCommentDone.likeMade && likeCommentDone.commentMade) {

          taskPerformRes = await sails.helpers.messageProcessor.sendMessageJoi({
            client: input.client,
            messageData: sails.config.custom.pushMessages.tasks.likes_comments_done.messages[0],
            additionalTokens: [
              {
                token: '$PostLink$',
                value: postRec.postLink,
              },
            ],
            additionalParams: {
              chat_id: input.client.chat_id,
              message_id: taskRec.messageId,
            },
          });

        }

        /**
         * При полностью невыполненном задании (нет ни лайка ни коммента):
         * трансформируем в чате аккаунта сообщение с требованием выполнить
         * задание в сообщение, что задание не было выполнено
         */

        if (!likeCommentDone.likeMade && !likeCommentDone.commentMade) {

          const messageData = sails.config.custom.pushMessages.tasks.likes_comments_not_done.messages[0].message;

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
            },
          });

        }

        /**
         * При частично выполненном задании (только лайк):
         * трансформируем в чате аккаунта сообщение с требованием выполнить задание в
         * сообщение, что задание было выполнено не полностью и необходимо оставить комментарий
         */

        if (likeCommentDone.likeMade && !likeCommentDone.commentMade) {

          const messageData = sails.config.custom.pushMessages.tasks.likes_comments_no_comment.messages[0].message;

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
            },
          });

        }

        /**
         * При частично выполненном задании (только комментарий):
         * трансформируем в чате аккаунта сообщение с требованием выполнить задание в
         * сообщение, что задание было выполнено не полностью и необходимо поставить лайк
         */

        if (!likeCommentDone.likeMade && likeCommentDone.commentMade) {

          const messageData = sails.config.custom.pushMessages.tasks.likes_comments_no_like.messages[0].message;

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


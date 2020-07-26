"use strict";

const Joi = require('@hapi/joi');
const uuid = require('uuid-apikey');

const moduleName = 'push-messages:tasks:callback-likes-joi';


module.exports = {


  friendlyName: 'push-messages:tasks:callback-likes-joi',


  description: 'Обработка callback сообщения, полученного при нажатии кнопки в задании на лайки',


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

      const queryDataRegExp = /push_msg_tsk_l_(\S+)/;

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

      const activeParser = sails.config.custom.config.parsers.inst.activeParserName;

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

        /**
         * Выполняем действия для случая успешного выполнения задания
         */

        taskData.makeLikePerformed = true;
        postData.receivedLikes++;
        postData.allLikesDone = postData.receivedLikes >= postRec.requestedLikes;

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
            made_likes_day: ++account.made_likes_day,
            made_likes_total: ++account.made_likes_total,
          },
          createdBy: moduleName,
        });

        /**
         * Трансформируем в чате аккаунта сообщение с требованием выполнить задание
         * в сообщение, что задание успешно выполнено
         */

        if (taskRec.messageId != null) {

          taskPerformRes = await sails.helpers.messageProcessor.sendMessageJoi({
            client: input.client,
            messageData: sails.config.custom.pushMessages.tasks.likes_done[0],
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

      } else {

        /**
         * Выполняем необходимые действия в случае невыполнения задания
         */

        const messageData = sails.config.custom.pushMessages.tasks.likes_not_done[0];

        // messageData.message.inline_keyboard = _.concat(messageData.message.inline_keyboard,
        //   [
        //     [
        //       {
        //         "text": "MSG_TASK_PERFORM_BTN",
        //         "callback_data": "push_msg_tsk_l_" + taskRec.guid
        //       }
        //     ]
        //   ]
        // );

        messageData.message.inline_keyboard[1] = [
          {
            "text": "MSG_TASK_PERFORM_BTN",
            "callback_data": "push_msg_tsk_l_" + taskRec.guid
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

      return exits.success({
        status: 'ok',
        message: 'callbackLikes performed',
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


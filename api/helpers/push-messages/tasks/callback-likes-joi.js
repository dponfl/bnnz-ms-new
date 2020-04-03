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

      const input = await schema.validateAsync(inputs.params);

      const queryDataRegExp = /push_msg_tsk_l_(\S+)/;

      const queryData = queryDataRegExp.exec(input.query.data);

      if (queryData.length !== 3) {
        throw new Error(`${moduleName}, Error: query.data has wrong format: ${input.query.data}`);
      }

      const taskGuid = queryData[2];

      if (!uuid.isUUID(taskGuid)) {
        throw new Error(`${moduleName}, Error: query.data task code is not a guid: ${taskGuid}`);
      }

      /**
       * Получаем информацию по заданию
       */

      const taskRecRaw = await sails.helpers.storage.tasksGetJoi({
        guid: taskGuid,
      });

      if (taskRecRaw.payload.length() > 1) {
        throw new Error(`${moduleName}, Error: Several tasks with the same guid: 
        guid: ${taskGuid}
        tasks: ${JSON.stringify(taskRecRaw.payload, null, 3)}`);
      }

      if (taskRecRaw.payload.length() === 1) {
        throw new Error(`${moduleName}, Error: No tasks for this guid: ${taskGuid}`);
      }

      const taskRec = taskRecRaw.payload[0];

      const account = _.find(input.client.accounts, {guid: taskRec.accountGuid});

      if (account == null) {
        throw new Error(`${moduleName}, Error: No account found for this guid: ${taskRec.accountGuid}`);
      }

      const instProfile = account.inst_profile;

      const postRec = Posts.findOne({guid: taskRec.postGuid});

      if (postRec == null) {
        throw new Error(`${moduleName}, Error: No post found for this guid: ${taskRec.postGuid}`);
      }

      const postLink = postRec.postLink;

      const instPostCode = await sails.helpers.general.getPostCodeJoi({postLink});

      /**
       * Проверка выполнения задания с использванием парсера
       */

      const likeDone = await sails.helpers.parsers.inst.ninja.checkLikesJoi({
        instProfile,
        instPostCode,
      });

      if (likeDone) {

        /**
         * Выполняем действия для случая успешного выполнения задания
         */

        const makeLikePerformed = true;

        await sails.helpers.storage.tasksUpdateJoi({
          criteria: taskRec.guid,
          data: {
            makeLikePerformed,
          }
        });

        // const receivedLikes =

      } else {

        /**
         * Выполняем необходимые действия в случае невыполнения задания
         */



      }




      return exits.success({
        status: 'ok',
        message: 'callbackLikes performed',
        payload: {},
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


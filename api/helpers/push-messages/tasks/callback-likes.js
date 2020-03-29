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

      const taskRaw = _.split(input.query.data,'push_msg_tsk_l_', 2);
      const taskGuid = taskRaw[1];

      if (!uuid.isUUID(taskGuid)) {
        throw new Error(`${moduleName}, Error: query.data has no task guid: ${input.query.data}`);
      }

      /**
       * Получаем информацию по заданию
       */

      const taskRecRaw = await sails.helpers.storage.tasksGet.with({
        taskGuid: taskGuid,
      });

      const taskRec = taskRecRaw.payload;

      /**
       * Проверка выполнения задания с использванием парсера
       */



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


"use strict";

const moduleName = 'push-messages:tasks:callback-likes';


module.exports = {


  friendlyName: 'push-messages:tasks:callback-likes',


  description: 'Обработка callback сообщения, полученного при нажатии кнопки в задании на лайки',


  inputs: {

    client: {
      friendlyName: 'client',
      description: 'Client record',
      type: 'ref',
      required: true,
    },
    block: {
      friendlyName: 'block',
      description: 'Current funnel block',
      type: 'ref',
      required: true,
    },
    query: {
      friendlyName: 'query',
      description: 'Callback query received',
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

    try {

      const taskRaw = _.split(inputs.query.data,'push_msg_tsk_l_', 2);
      const taskGuid = taskRaw[1];

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
          payload: {},
        }
      };

    }

  }

};


"use strict";

const { Random } = require("random-js");
const random = new Random(); // uses the nativeMath engine

const moduleName = 'tasks:generate-task-type';


module.exports = {


  friendlyName: 'tasks:generate-task-type',


  description: 'Generate type of the task',


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

    let taskType = sails.config.custom.config.tasks.task_types.LIKE;

    try {

      if (random.bool(sails.config.custom.config.tasks.comments_ratio)) {
        taskType = sails.config.custom.config.tasks.task_types.LIKE_AND_COMMENT;
      }

      return exits.success({
        status: 'ok',
        message: 'Task type generated',
        payload: taskType,
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
      //     payload: {},
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


"use strict";

const moduleName = 'test:storage:dropTasks';


module.exports = {


  friendlyName: 'test:storage:dropTasks',


  description: 'Drops Tasks table',


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

    try {

      await Tasks.destroy({});

      return exits.success({
        status: 'ok',
        message: 'Tasks table dropped',
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


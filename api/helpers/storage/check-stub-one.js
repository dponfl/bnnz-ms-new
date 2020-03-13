"use strict";

const moduleName = 'storage:check-stub-one';


module.exports = {


  friendlyName: 'storage:check-stub-one',


  description: '***********************',


  inputs: {

    data: {
      friendlyName: '*****',
      description: '*****',
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

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: inputs.data,
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


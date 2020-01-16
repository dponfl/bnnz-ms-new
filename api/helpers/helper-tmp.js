"use strict";

const moduleName = 'module:helper';


module.exports = {


  friendlyName: 'module:helper',


  description: '***********************',


  inputs: {

    account: {
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
        message: '**************',
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


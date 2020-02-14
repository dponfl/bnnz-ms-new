"use strict";

const moduleName = 'test:testTmp';


module.exports = {


  friendlyName: 'test:testTmp',


  description: 'description',


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

      let some = process.env.TEST_VAL || null;
      let val = null;

      switch (some) {
        case 'one':
          val = 'one value';
          sails.log.debug(`Some=${val}`);
          break;
        case 'two':
          val = 'two value';
          sails.log.debug(`Some=${val}`);
          break;
        case 'three':
          val = 'three value';
          sails.log.debug(`Some=${val}`);
          break;
        default:
          sails.log.debug(`Some=${val}`);
      }

      return exits.success({
        status: 'ok',
        message: 'Test finished',
        payload: {val: val},
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



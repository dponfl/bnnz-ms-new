"use strict";

const moduleName = 'push-messages:tasks:test-sinon-stubs';


module.exports = {


  friendlyName: 'push-messages:tasks:test-sinon-stubs',


  description: 'push-messages:tasks:test-sinon-stubs',


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



      return exits.success({
        status: 'ok',
        message: 'testSinonStubs helper performed',
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


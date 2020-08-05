"use strict";

const moduleName = 'test:test-logs';


module.exports = {


  friendlyName: 'test:test-logs',


  description: 'test:test-logs',


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

      await LogProcessor.error({
        message: 'Error log message',
        clientGuid: '1ee516d9-6280-43c8-8ff2-9802aac2f074',
        accountGuid: '2f303457-e4f3-4535-aa61-1e9ced91407b',
        requestId: '2f303457-e4f3-4535-aa61-1e9ced91407A',
        childRequestId: '2f303457-e4f3-4535-aa61-1e9ced91407B',
        errorName: 'ERROR_NAME',
        location: moduleName,
        payload: {
          keyOne: 4,
          keyTwo: 'Error log message',
        }
      });

      await LogProcessor.critical({
        message: 'Critical log message',
        clientGuid: '1ee516d9-6280-43c8-8ff2-9802aac2f074',
        accountGuid: '2f303457-e4f3-4535-aa61-1e9ced91407b',
        requestId: '2f303457-e4f3-4535-aa61-1e9ced91407A',
        childRequestId: '2f303457-e4f3-4535-aa61-1e9ced91407B',
        errorName: 'ERROR_NAME',
        location: moduleName,
        emergencyLevel: 'high',
        payload: {
          keyOne: 5,
          keyTwo: 'Critical error log message',
        }
      });

      await LogProcessor.error({
        message: 'Next Error log message',
        location: moduleName,
      });


      await LogProcessor.warn({
        message: 'New Warn log message',
        clientGuid: '1ee516d9-6280-43c8-8ff2-9802aac2f074',
        accountGuid: '2f303457-e4f3-4535-aa61-1e9ced91407b',
        location: moduleName,
        payload: {
          keyOne: 3,
          keyTwo: 'Warn log message',
        }
      });


      await LogProcessor.info({
        message: 'New Info log message',
        clientGuid: '1ee516d9-6280-43c8-8ff2-9802aac2f074',
        accountGuid: '2f303457-e4f3-4535-aa61-1e9ced91407b',
        payload: {
          keyOne: 1,
          keyTwo: 'Info log message',
        }
      });

      sails.log.silly('SILLY: Test message', {a: 1, b: 'ABC'});
      sails.log.verbose('VERBOSE: Test message', {a: 1, b: 'ABC'});
      sails.log.info('INFO: Test message', {a: 1, b: 'ABC'});
      sails.log.debug('DEBUG: Test message', {a: 1, b: 'ABC'});
      sails.log.warn('WARN: Test message', {a: 1, b: 'ABC'});
      sails.log.error('ERROR: Test message', {a: 1, b: 'ABC'});



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



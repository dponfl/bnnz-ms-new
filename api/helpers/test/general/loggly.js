"use strict";

const moduleName = 'test:general:loggly';


module.exports = {


  friendlyName: 'test:general:loggly',


  description: 'test:general:loggly',


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

      await LogProcessor.info({
        message: 'Some info message here...',
        clientGuid: '6b8fd6e9-07f7-460a-bd3e-e81d0ea66cc0',
        accountGuid: '1dd34581-78bc-41ed-b605-b3fc3fbcfe9a',
        requestId: 'c7fcd335-a68a-4d90-90e1-cf200942774b',
        childRequestId: '1fab68e5-1b1a-430a-a491-33542b4b2631',
        errorName: sails.config.custom.GENERAL_ERROR.name,
        location: 'module name here...',
        payload: {
          key01: 'text value',
          key02: 123,
          key03: null,
          key04: {
            key04_01: 'some text here...',
            key04_02: 321,
            key04_03: null,
          }
        },
      });


      await LogProcessor.debug({
        message: 'Some debug message here...',
        clientGuid: '6b8fd6e9-07f7-460a-bd3e-e81d0ea66cc0',
        accountGuid: '1dd34581-78bc-41ed-b605-b3fc3fbcfe9a',
        requestId: 'c7fcd335-a68a-4d90-90e1-cf200942774b',
        childRequestId: '1fab68e5-1b1a-430a-a491-33542b4b2631',
        errorName: sails.config.custom.GENERAL_ERROR.name,
        location: 'module name here...',
        payload: {
          key01: 'text value',
          key02: 123,
          key03: null,
          key04: {
            key04_01: 'some text here...',
            key04_02: 321,
            key04_03: null,
          }
        },
      });


      await LogProcessor.warn({
        message: 'Some warn message here...',
        clientGuid: '6b8fd6e9-07f7-460a-bd3e-e81d0ea66cc0',
        accountGuid: '1dd34581-78bc-41ed-b605-b3fc3fbcfe9a',
        requestId: 'c7fcd335-a68a-4d90-90e1-cf200942774b',
        childRequestId: '1fab68e5-1b1a-430a-a491-33542b4b2631',
        errorName: sails.config.custom.GENERAL_ERROR.name,
        location: 'module name here...',
        payload: {
          key01: 'text value',
          key02: 123,
          key03: null,
          key04: {
            key04_01: 'some text here...',
            key04_02: 321,
            key04_03: null,
          }
        },
      });


      await LogProcessor.error({
        message: 'Some error message here...',
        clientGuid: '6b8fd6e9-07f7-460a-bd3e-e81d0ea66cc0',
        accountGuid: '1dd34581-78bc-41ed-b605-b3fc3fbcfe9a',
        requestId: 'c7fcd335-a68a-4d90-90e1-cf200942774b',
        childRequestId: '1fab68e5-1b1a-430a-a491-33542b4b2631',
        errorName: sails.config.custom.GENERAL_ERROR.name,
        location: 'module name here...',
        payload: {
          key01: 'text value',
          key02: 123,
          key03: null,
          key04: {
            key04_01: 'some text here...',
            key04_02: 321,
            key04_03: null,
          }
        },
      });


      await LogProcessor.critical({
        message: 'Some critical.low level message here...',
        clientGuid: '6b8fd6e9-07f7-460a-bd3e-e81d0ea66cc0',
        accountGuid: '1dd34581-78bc-41ed-b605-b3fc3fbcfe9a',
        requestId: 'c7fcd335-a68a-4d90-90e1-cf200942774b',
        childRequestId: '1fab68e5-1b1a-430a-a491-33542b4b2631',
        errorName: sails.config.custom.GENERAL_ERROR.name,
        emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
        location: 'module name here...',
        payload: {
          key01: 'text value',
          key02: 123,
          key03: null,
          key04: {
            key04_01: 'some text here...',
            key04_02: 321,
            key04_03: null,
          }
        },
      });


      await LogProcessor.critical({
        message: 'Some critical.medium level message here...',
        clientGuid: '6b8fd6e9-07f7-460a-bd3e-e81d0ea66cc0',
        accountGuid: '1dd34581-78bc-41ed-b605-b3fc3fbcfe9a',
        requestId: 'c7fcd335-a68a-4d90-90e1-cf200942774b',
        childRequestId: '1fab68e5-1b1a-430a-a491-33542b4b2631',
        errorName: sails.config.custom.GENERAL_ERROR.name,
        emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
        location: 'module name here...',
        payload: {
          key01: 'text value',
          key02: 123,
          key03: null,
          key04: {
            key04_01: 'some text here...',
            key04_02: 321,
            key04_03: null,
          }
        },
      });


      await LogProcessor.critical({
        message: 'Some critical.high level message here...',
        clientGuid: '6b8fd6e9-07f7-460a-bd3e-e81d0ea66cc0',
        accountGuid: '1dd34581-78bc-41ed-b605-b3fc3fbcfe9a',
        requestId: 'c7fcd335-a68a-4d90-90e1-cf200942774b',
        childRequestId: '1fab68e5-1b1a-430a-a491-33542b4b2631',
        errorName: sails.config.custom.GENERAL_ERROR.name,
        emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
        location: 'module name here...',
        payload: {
          key01: 'text value',
          key02: 123,
          key03: null,
          key04: {
            key04_01: 'some text here...',
            key04_02: 321,
            key04_03: null,
          }
        },
      });


      await LogProcessor.critical({
        message: 'Some critical.highest level message here...',
        clientGuid: '6b8fd6e9-07f7-460a-bd3e-e81d0ea66cc0',
        accountGuid: '1dd34581-78bc-41ed-b605-b3fc3fbcfe9a',
        requestId: 'c7fcd335-a68a-4d90-90e1-cf200942774b',
        childRequestId: '1fab68e5-1b1a-430a-a491-33542b4b2631',
        errorName: sails.config.custom.GENERAL_ERROR.name,
        emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
        location: 'module name here...',
        payload: {
          key01: 'text value',
          key02: 123,
          key03: null,
          key04: {
            key04_01: 'some text here...',
            key04_02: 321,
            key04_03: null,
          }
        },
      });



      return exits.success({
        status: 'ok',
        message: 'Loggly test finished',
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



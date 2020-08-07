"use strict";

const moduleName = 'test:test-error-inner-inner';


module.exports = {


  friendlyName: 'test:test-error-inner-inner',


  description: 'description',


  inputs: {
  },


  exits: {

    success: {
      description: 'All done.',
    },

    err: {
      description: 'Error',
    },

    // BFErrorExit: {
    //   description: 'BF customized error type 01',
    // },
    //
    // BFErrorDetectedExit: {
    //   description: 'BF customized error type 02',
    // },

  },


  fn: async function (inputs, exits) {

    try {

      // await sails.helpers.general.throwErrorJoi({
      //   errorType: sails.config.custom.enums.errorType.ERROR,
      //   location: moduleName,
      //   message: 'Some error explanation message here...',
      //   payload: {
      //     keyOne: 1,
      //     keyTwo: 'one',
      //   },
      //   errorName: 'ERROR_NAME',
      // });

      // const some = `${undefinedProperty}`;

      // throw new Error(`${moduleName}: Some error explanation message here...`);

      return exits.success();

    } catch (e) {
      // if (e.code === 'BFErrorExit') {
      //   throw {
      //     BFErrorExit: e.raw != null ? e.raw : {}
      //   }
      // } else if (e.code === 'BFErrorDetectedExit') {
      //   throw {
      //     BFErrorDetectedExit: e.raw != null ? e.raw : {}
      //   }
      // } else if (_.has(e, 'BFErrorExit')) {
      //   throw {
      //     BFErrorExit: e.BFErrorExit != null ? e.BFErrorExit : {}
      //   }
      // } else {
      //   const errorLocation = moduleName;
      //   const errorMsg = e.message != null ? e.message : 'No error message';
      //   const errorName = e.name != null ? e.name : 'No error name';
      //   const errorPayload = e.raw != null ? e.raw : {};
      //   const errorStack = e.stack != null ? _.truncate(e.stack, {
      //     length: 500,
      //     omission: ' [...]',
      //   }) : 'No error stack';
      //   const error = {
      //     errorLocation,
      //     errorMsg,
      //     errorName,
      //     errorPayload,
      //     errorStack,
      //   };
      //   await LogProcessor.error({
      //     message: errorMsg,
      //     // clientGuid,
      //     // accountGuid,
      //     // requestId: null,
      //     // childRequestId: null,
      //     errorName,
      //     location: errorLocation,
      //     payload: {
      //       errorPayload,
      //       errorStack,
      //     },
      //   });
      //   throw {
      //     BFErrorDetectedExit: {
      //       error,
      //     }
      //   };
      // }

      return await sails.helpers.general.catchErrorJoi({
        error: e,
        location: moduleName,
      });

    }

  }
};



"use strict";

const moduleName = 'test:testErrors';


module.exports = {


  friendlyName: 'test:testErrors',


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

      await sails.helpers.test.testErrorInner();

      // const errorLocation = moduleName;
      // const errorMsg = 'Some error explanation message here...';
      // const payload = {
      //   keyOne: 3,
      //   keyTwo: 'three',
      // };
      // const errorName = 'ERROR_NAME';
      // const errorRaw = payload;
      // await LogProcessor.error({
      //   message: errorMsg,
      //   // clientGuid,
      //   // accountGuid,
      //   // requestId: null,
      //   // childRequestId: null,
      //   errorName,
      //   location: errorLocation,
      //   payload: errorRaw,
      // });
      // throw {
      //   BFErrorExit: {
      //     location: errorLocation,
      //     message: errorMsg,
      //     payload,
      //   }
      // };

      // const some = `${undefinedProperty}`;

      // throw new Error(`${moduleName}: Some error explanation message here...`);

      return exits.success();


    } catch (e) {
      // let errorObj;
      // if (e.code != null && e.code === 'E_INTERNAL_ERROR') {
      //   if (e.raw != null && _.isObject(e.raw)) {
      //     errorObj = e.raw;
      //   }
      // } else {
      //   errorObj = e;
      // }
      // if (errorObj.code === 'BFErrorExit') {
      //   throw {
      //     BFErrorExit: errorObj.raw != null ? errorObj.raw : {}
      //   }
      // } else if (errorObj.code === 'BFErrorDetectedExit') {
      //   throw {
      //     BFErrorDetectedExit: errorObj.raw != null ? errorObj.raw : {}
      //   }
      // } else if (_.has(errorObj, 'BFErrorExit')) {
      //   throw {
      //     BFErrorExit: errorObj.BFErrorExit != null ? errorObj.BFErrorExit : {}
      //   }
      // } else {
      //   const errorLocation = moduleName;
      //   const errorMsg = errorObj.message != null ? errorObj.message : 'No error message';
      //   const errorName = errorObj.name != null ? errorObj.name : 'No error name';
      //   const errorPayload = errorObj.raw != null ? errorObj.raw : {};
      //   const errorStack = errorObj.stack != null ? _.truncate(errorObj.stack, {
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
        throwError: true,
      });

    }

  }
};



"use strict";

module.exports = {


  friendlyName: 'optin::beforeHelperJoi',


  description: 'optin::beforeHelperJoi',


  inputs: {
    params: {
      friendlyName: 'input params',
      description: 'input params',
      type: 'ref',
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
    return exits.success({
      status: 'ok',
      message: 'Success',
      payload: {}
    });
  }

};


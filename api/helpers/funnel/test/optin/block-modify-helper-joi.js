"use strict";

module.exports = {


  friendlyName: 'optin::blockModifyHelperJoi',


  description: 'optin::blockModifyHelperJoi',


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


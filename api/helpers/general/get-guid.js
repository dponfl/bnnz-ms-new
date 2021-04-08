"use strict";

const uuid = require('uuid-apikey');

const moduleName = 'general:get-guid';


module.exports = {


  friendlyName: 'general:get-guid',


  description: 'general:get-guid',


  inputs: {

    params: {
      friendlyName: 'input params',
      description: 'input params',
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

      const uuidApiKey = uuid.create();

      const guid = uuidApiKey.uuid;
      const key = uuidApiKey.apiKey;

      return exits.success({
        guid,
        key,
      })

    } catch (e) {

      const throwError = false;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
        });
        return exits.success({
          status: 'error',
          message: `${moduleName} not performed`,
          payload: {},
        });
      }

    }

  }

};


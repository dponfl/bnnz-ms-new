"use strict";

const uuid = require('uuid-apikey');

const moduleName = 'general:checkApiKey';


module.exports = {


  friendlyName: 'Check API key',

  description: 'Check API key',

  inputs: {
    apiKey: {
      friendlyName: 'apiKey',
      description: 'API key',
      type: 'string',
      required: true,
    },
  },

  exits: {

    success: {
      description: 'All done.',    },

  },


  fn: async function (inputs, exits) {

    sails.log.warn('******************** ' + moduleName + ' ********************');


    try {

      if (uuid.check(inputs.apiKey, sails.config.custom.apiUuid)) {
        return exits.success({
          status: 'ok',
          message: 'Success',
          payload: {}
        });
      } else {
        return exits.success({
          status: 'nok',
          message: 'Error key',
          payload: {}
        });
      }

    } catch (e) {

      const errorLocation = 'api/helpers/general/check-api-key';
      const errorMsg = 'Error';

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      return exits.success({
        status: 'nok',
        message: 'Error key',
        payload: {}
      });

    }

  } // fn

};


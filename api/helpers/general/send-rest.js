"use strict";

const rp = require('request-promise');
const _ = require('lodash');

const moduleName = 'Helper general:send-rest';
const BB = require('bluebird');



module.exports = {


  friendlyName: 'Send rest',


  description: 'Helper to perform REST request',


  inputs: {

    method: {
      friendlyName: 'Method name',
      description: 'Method name',
      type: 'string',
      required: true,
    },

    url: {
      friendlyName: 'URL',
      description: 'URL',
      type: 'string',
      required: true,
    },

    params: {
      friendlyName: 'Parameters',
      description: 'Parameters object',
      type: 'ref',
      required: true,
    }

  },


  exits: {

    success: {
      description: 'All done.',
    },

    err: {
      description: 'Error exit',
    },

  },


  fn: async function (inputs, exits) {

    // sails.log(moduleName + ', inputs: ', inputs);

    const possibleMethods = ['POST', 'GET'];

    if (!_.some(possibleMethods, (val) => {
      return val === inputs.method;
    })) {

      // return exits.success({status: 'nok', message: 'No method or wrong method', payload: {}});

      const errorLocation = 'api/helpers/general/send-rest';
      const errorMsg = sails.config.custom.SENDREST_NO_METHOD;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
        }
      };
    }

    if (!inputs.url) {

      const errorLocation = 'api/helpers/general/send-rest';
      const errorMsg = sails.config.custom.SENDREST_NO_URL;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
        }
      };
    }

    let options = {
      method: inputs.method,
      uri: sails.config.HOST + inputs.url,
      body: inputs.params,
      json: true
    };

    let result = await rp(options);

    if (!result) {

      const errorLocation = 'api/helpers/general/send-rest';
      const errorMsg = sails.config.custom.SENDREST_NO_RESULT;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
        }
      };

    } else {

      return exits.success({status: 'ok', message: 'success', payload: result});

    }

  }


};

async function test() {

  return new BB((resolve) => {
    setTimeout(() => {sails.log.warn('slow message'); resolve()}, 5000);
  });

}


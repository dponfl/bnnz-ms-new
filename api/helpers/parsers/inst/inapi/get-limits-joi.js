"use strict";

const Joi = require('@hapi/joi');
const rp = require('request-promise');


const moduleName = 'parsers:inst:inapi:get-limits-joi';


module.exports = {


  friendlyName: 'parsers:inst:inapi:get-limits-joi',


  description: 'Получение остатка лимита по запросам',


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

      const options = {
        uri: sails.config.custom.instParserUrl + sails.config.custom.config.parsers[sails.config.custom.config.parsers.inst].paths.getLimits,
        method: 'GET',
        qs: {
          api_key: sails.config.custom.instParserApiKey,
        },
        json: true,
      };

      const requestRes = await rp(options);

      const left = _.get(requestRes, 'response.api.left', null);
      const history = _.get(requestRes, 'response.api.history', null);


      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {
          left,
          history,
        },
        raw: requestRes,
      })


    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {
            error: e,
          },
        }
      };

    }

  }

};


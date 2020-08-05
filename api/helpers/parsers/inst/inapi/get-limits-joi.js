"use strict";

const Joi = require('@hapi/joi');
const rp = require('request-promise');
const moment = require('moment');


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

      const platform = 'Instagram';
      const action = 'parsing';
      const api = 'inapi';
      const requestType = 'getLimits';
      let status = '';

      const momentStart = moment();

      const options = {
        uri: sails.config.custom.instParserUrl + sails.config.custom.config.parsers.inst[sails.config.custom.config.parsers.inst.activeParserName].paths.getLimits,
        method: 'GET',
        qs: {
          api_key: sails.config.custom.instParserApiKey,
        },
        json: true,
      };

      const requestRes = await rp(options);

      const responseStatusMain = _.get(requestRes, 'status', null);
      const responseStatusInner = _.get(requestRes, 'response.status', null);

      if (responseStatusMain !== 'success' || responseStatusInner !== 'success') {
        // throw new Error(`${moduleName}, error => wrong parser response:
        // request params: ${JSON.stringify(options, null, 3)}
        // request response: ${JSON.stringify(requestRes, null, 3)}`);

        status = 'error';
        const momentDone = moment();

        const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

        const performanceCreateParams = {
          platform,
          action,
          api,
          requestType,
          requestDuration,
          status,
          comments: {
            responseStatusMain,
            responseStatusInner,
            request_id: _.get(requestRes, 'request_id', null),
          },
        };

        await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

        await LogProcessor.error({
          message: sails.config.custom.INST_PARSER_WRONG_RESPONSE_STATUS.message,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.INST_PARSER_WRONG_RESPONSE_STATUS.name,
          location: moduleName,
          payload: requestRes,
        });


        return exits.success({
          status: 'error',
          message: `${moduleName} performed with error`,
          payload: {},
          raw: requestRes,
        })

      }

      const left = _.get(requestRes, 'response.api.left', null);
      // const history = _.get(requestRes, 'response.api.history', null);

      status = 'success';

      const momentDone = moment();

      const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

      const performanceCreateParams = {
        platform,
        action,
        api,
        requestType,
        requestDuration,
        status,
        comments: {
          responseStatusMain,
          responseStatusInner,
          request_id: _.get(requestRes, 'request_id', null),
        },
      };

      await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);


      return exits.success({
        status: 'success',
        message: `${moduleName} performed`,
        payload: {
          left,
          // history,
        },
        raw: requestRes,
      })


    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

      await LogProcessor.error({
        message: e.message || errorMsg,
        // requestId: null,
        // childRequestId: null,
        errorName: e.name || 'none',
        location: errorLocation,
        payload: e.raw || {},
      });

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {
            error: e.raw || {},
          },
        }
      };

    }

  }

};


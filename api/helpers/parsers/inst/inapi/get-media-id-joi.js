"use strict";

const Joi = require('@hapi/joi');
const rp = require('request-promise');
const moment = require('moment');


const moduleName = 'parsers:inst:inapi:get-media-id-joi';


module.exports = {


  friendlyName: 'parsers:inst:inapi:get-media-id-joi',


  description: 'Получение mediaId по коду',


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

    const schema = Joi.object({
      shortCode: Joi
        .string()
        .description('Instagram media shortcode')
        .required(),
    });


    try {

      const input = await schema.validateAsync(inputs.params);

      const platform = 'Instagram';
      const action = 'parsing';
      const api = 'inapi';
      const requestType = 'getMediaId';
      let status = '';

      const momentStart = moment();

      const options = {
        uri: sails.config.custom.instParserUrl + sails.config.custom.config.parsers.inst[sails.config.custom.config.parsers.inst.activeParserName].paths.getMediaId,
        method: 'GET',
        qs: {
          api_key: sails.config.custom.instParserApiKey,
          shortcode: input.shortCode,
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

        return exits.success({
          status: 'error',
          message: `${moduleName} performed with error`,
          payload: {},
          raw: requestRes,
        })

      }

      const mediaId = _.get(requestRes, 'response.api.media.shortcode_media.id', null);

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
          mediaId,
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


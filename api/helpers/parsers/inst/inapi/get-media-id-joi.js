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
      client: Joi
        .any()
        .description('Client record')
        .required(),
      shortCode: Joi
        .string()
        .description('Instagram media shortcode')
        .required(),
    });

    let clientGuid;
    let accountGuid;


    try {

      const input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

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

      // TODO: Убрать позже (использовалось для проверки работы при ошибке парсера)
      // const requestRes = {status: 'error'};

      const responseStatusMain = _.get(requestRes, 'status', null);
      const responseStatusInner = _.get(requestRes, 'response.status', null);

      if (responseStatusMain !== 'success' || responseStatusInner !== 'success') {

        status = 'error';
        const momentDone = moment();

        const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

        await LogProcessor.error({
          message: sails.config.custom.INST_PARSER_WRONG_RESPONSE_STATUS.message,
          clientGuid,
          accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.INST_PARSER_WRONG_RESPONSE_STATUS.name,
          location: moduleName,
          payload: {
            requestParams: _.omit(options, 'qs.api_key'),
            rawResponse: requestRes,
          },
        });

        const performanceCreateParams = {
          platform,
          action,
          api,
          requestType,
          requestDuration,
          status,
          clientGuid,
          accountGuid,
          comments: {
            responseStatusMain,
            responseStatusInner,
            request_id: _.get(requestRes, 'request_id', null),
            error: 'wrong parser response status',
            requestParams: _.omit(options, 'qs.api_key'),
            rawResponse: requestRes,
          },
        };

        await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

        return exits.success({
          status: 'error',
          message: `${moduleName} performed with error`,
          payload: {
            error: 'wrong parser response status',
          },
          raw: requestRes,
        })

      }

      // if (!_.has(requestRes, 'response.api.media.shortcode_media.id')) {
      //
      //   status = 'error';
      //   const momentDone = moment();
      //
      //   const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();
      //
      //   await LogProcessor.error({
      //     message: sails.config.custom.INST_PARSER_WRONG_RESPONSE_STATUS.message,
      //     clientGuid,
      //     accountGuid,
      //     // requestId: null,
      //     // childRequestId: null,
      //     errorName: sails.config.custom.INST_PARSER_WRONG_RESPONSE_STATUS.name,
      //     location: moduleName,
      //     payload: {
      //       requestParams: _.omit(options, 'qs.api_key'),
      //       rawResponse: requestRes,
      //     },
      //   });
      //
      //   const performanceCreateParams = {
      //     platform,
      //     action,
      //     api,
      //     requestType,
      //     requestDuration,
      //     status,
      //     clientGuid,
      //     accountGuid,
      //     comments: {
      //       responseStatusMain,
      //       responseStatusInner,
      //       request_id: _.get(requestRes, 'request_id', null),
      //       error: 'wrong parser response content',
      //       requestParams: _.omit(options, 'qs.api_key'),
      //       rawResponse: requestRes,
      //     },
      //   };
      //
      //   await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);
      //
      //   return exits.success({
      //     status: 'error',
      //     message: `${moduleName} performed with error`,
      //     payload: {
      //       error: 'wrong parser response content',
      //     },
      //     raw: requestRes,
      //   })
      //
      // }

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
        clientGuid,
        accountGuid,
        comments: {
          responseStatusMain,
          responseStatusInner,
          request_id: _.get(requestRes, 'request_id', null),
          requestParams: _.omit(options, 'qs.api_key'),
          rawResponse: requestRes,
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
          status: 'ok',
          message: `${moduleName} performed`,
          payload: {},
        });
      }
    }

  }

};


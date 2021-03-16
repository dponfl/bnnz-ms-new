"use strict";

const Joi = require('@hapi/joi');
const rp = require('request-promise');
const moment = require('moment');


const moduleName = 'parsers:inst:inapi:get-likers-joi';


module.exports = {


  friendlyName: 'parsers:inst:inapi:get-likers-joi',


  description: 'Получение информации о тех, кто поставил лайк',


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
      mediaId: Joi
        .string()
        .description('Instagram media id')
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
      const requestType = 'getLikes';
      let status = '';

      const momentStart = moment();

      const options = {
        uri: sails.config.custom.config.parsers.inst.inapi.url + sails.config.custom.config.parsers.inst.inapi.paths.getLikes,
        method: 'GET',
        qs: {
          api_key: sails.config.custom.config.parsers.inst.inapi.apiKey,
          mediaId: input.mediaId,
          sort: 1,
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

      const users = _.get(requestRes, 'response.instagram.users', null);

      if (users == null) {
        // throw new Error(`${moduleName}, error => wrong parser response: no users
        // request params: ${JSON.stringify(options, null, 3)}
        // request response: ${JSON.stringify(requestRes, null, 3)}`);

        status = 'error';
        const momentDone = moment();

        const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

        await LogProcessor.error({
          message: sails.config.custom.INST_PARSER_NO_USERS.message,
          clientGuid,
          accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.INST_PARSER_NO_USERS.name,
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
            error: 'wrong parser response: no response.instagram.users',
            requestParams: _.omit(options, 'qs.api_key'),
            rawResponse: requestRes,
          },
        };

        await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

        return exits.success({
          status: 'error',
          message: `${moduleName} performed with error`,
          payload: {
            error: 'wrong parser response: no response.instagram.users',
          },
          raw: requestRes,
        })

      }

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
          users,
          requestParams: _.omit(options, 'qs.api_key'),
          rawResponse: requestRes,
        },
      };

      await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

      return exits.success({
        status: 'success',
        message: `${moduleName} performed`,
        payload: {
          users
        },
        raw: requestRes,
      })


    } catch (e) {
      const throwError = false;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          clientGuid,
          accountGuid,
          error: e,
          location: moduleName,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          clientGuid,
          accountGuid,
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


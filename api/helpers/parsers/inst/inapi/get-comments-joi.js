"use strict";

const Joi = require('@hapi/joi');
const rp = require('request-promise');
const moment = require('moment');

const moduleName = 'parsers:inst:inapi:get-comments-joi';


module.exports = {


  friendlyName: 'parsers:inst:inapi:get-comments-joi',


  description: 'Получение информации о тех, кто оставил комментарий и текста комментария',


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
      const requestType = 'getComments';
      let status = '';

      const momentStart = moment();

      const options = {
        uri: sails.config.custom.instParserUrl + sails.config.custom.config.parsers.inst[sails.config.custom.config.parsers.inst.activeParserName].paths.getComments,
        method: 'GET',
        qs: {
          api_key: sails.config.custom.instParserApiKey,
          mediaId: input.mediaId,
        },
        json: true,
      };

      const requestRes = await rp(options);

      // TODO: Убрать позже (использовалось для проверки работы при ошибке парсера)
      // const requestRes = {status: 'error'};

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

        await LogProcessor.error({
          message: sails.config.custom.INST_PARSER_WRONG_RESPONSE_STATUS.message,
          clientGuid,
          accountGuid,
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

      const comments = _.get(requestRes, 'response.instagram.comments', null);

      if (comments == null) {
        // throw new Error(`${moduleName}, error => wrong parser response: no comments
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
          clientGuid,
          accountGuid,
          comments: {
            responseStatusMain,
            responseStatusInner,
            request_id: _.get(requestRes, 'request_id', null),
            error: 'wrong parser response: no response.instagram.comments',
            requestParams: _.omit(options, 'qs.api_key'),
            rawResponse: requestRes,
          },
        };

        await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

        await LogProcessor.error({
          message: sails.config.custom.INST_PARSER_NO_COMMENTS.message,
          clientGuid,
          accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.INST_PARSER_NO_COMMENTS.name,
          location: moduleName,
          payload: requestRes,
        });


        return exits.success({
          status: 'error',
          message: `${moduleName} performed with error`,
          payload: {
            error: 'wrong parser response: no response.instagram.comments',
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
        },
      };

      await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

      return exits.success({
        status: 'success',
        message: `${moduleName} performed`,
        payload: {
          comments
        },
        raw: requestRes,
      })


    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

      await LogProcessor.error({
        message: e.message || errorMsg,
        clientGuid,
        accountGuid,
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


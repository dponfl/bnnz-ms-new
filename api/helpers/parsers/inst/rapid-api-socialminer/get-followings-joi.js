"use strict";

const Joi = require('@hapi/joi');
const rp = require('request-promise');
const errors = require('request-promise/errors');
const moment = require('moment');


const moduleName = 'parsers:inst:rapid-api-socialminer:get-followings-joi';


module.exports = {


  friendlyName: 'parsers:inst:rapid-api-socialminer:get-followings-joi',


  description: 'parsers:inst:rapid-api-socialminer:get-followings-joi',


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
    },

    BFErrorExit: {
      description: 'BF customized error type 01',
    },

    BFErrorDetectedExit: {
      description: 'BF customized error type 02',
    },

  },


  fn: async function (inputs, exits) {

    const schema = Joi.object({
      client: Joi
        .any()
        .description('Client record')
        .required(),
      userId: Joi
        .string()
        .description('Instagram user id')
        .required(),
      endCursor: Joi
        .string()
        .description('end_cursor parameter'),
    });

    let client;
    let clientGuid;
    let accountGuid;

    let requestError = null;


    try {

      const input = await schema.validateAsync(inputs.params);

      client = input.client;
      clientGuid = client.guid;
      accountGuid = client.account_use;

      const platform = 'Instagram';
      const action = 'parsing';
      const api = 'rapidApiSocialminer';
      const requestType = 'getFollowing';
      let status = '';

      const parserUrl = sails.config.custom.config.parsers.inst.rapidApiSocialminer.url;
      const parserAction = sails.config.custom.config.parsers.inst.rapidApiSocialminer.paths.getFollowing;

      const momentStart = moment();

      const options = {
        uri: parserUrl + parserAction,
        method: 'GET',
        headers: {
          "x-rapidapi-host": sails.config.custom.config.parsers.inst.rapidApiSocialminer.apiHost,
          "x-rapidapi-key": sails.config.custom.config.parsers.inst.rapidApiSocialminer.apiKey,
        },
        qs: {
          user_id: input.userId,
        },
        json: true,
      };

      if (input.endCursor != null) {
        options.qs.end_cursor = _.trim(input.endCursor);
      }

      const requestRes = await rp(options)
        .catch(errors.StatusCodeError, async (reason) => {
          // The server responded with a status codes other than 2xx.
          // Check reason.statusCode

          if (_.has(reason, 'options.headers.x-rapidapi-key')) {
            _.set(reason, 'options.headers.x-rapidapi-key', '***');
          }

          if (_.has(reason, 'response.request.headers.x-rapidapi-key')) {
            _.set(reason, 'response.request.headers.x-rapidapi-key', '***');
          }

          const momentDone = moment();
          const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

          let performanceCreateParams;

          status = 'error';
          await LogProcessor.error({
            message: sails.config.custom.INST_PARSER_STATUS_CODE_ERROR.message,
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.INST_PARSER_STATUS_CODE_ERROR.name,
            location: moduleName,
            payload: reason,
          });

          performanceCreateParams = {
            platform,
            action,
            api,
            requestType,
            requestDuration,
            status,
            clientGuid,
            accountGuid,
            comments: reason,
          };

          await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

          requestError = {
            status: 'error',
            subStatus: 'StatusCodeError',
            message: `${moduleName} performed with error`,
            payload: reason,
          };

        })
        .catch(errors.RequestError, async (reason) => {
          // The request failed due to technical reasons.
          // reason.cause is the Error object Request would pass into a callback.

          if (_.has(reason, 'options.headers.x-rapidapi-key')) {
            _.set(reason, 'options.headers.x-rapidapi-key', '***');
          }

          status = 'error';
          const momentDone = moment();
          const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

          await LogProcessor.error({
            message: sails.config.custom.INST_PARSER_REQUEST_ERROR.message,
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.INST_PARSER_REQUEST_ERROR.name,
            location: moduleName,
            payload: reason,
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
            comments: reason,
          };

          await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

          requestError = {
            status: 'error',
            subStatus: 'RequestError',
            message: `${moduleName} performed with error`,
            payload: {
              name: reason.name,
              message: reason.message,
              cause: reason.cause,
            },
          };

        });

      if (requestError) {
        return exits.success(requestError);
      }

      if (
        _.isNil(requestRes.success)
        || !requestRes.success
      ) {

        status = 'error';
        const momentDone = moment();

        const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

        await LogProcessor.error({
          message: sails.config.custom.INST_PARSER_WRONG_RESPONSE_STATUS.message + `: No "success" key or false`,
          clientGuid,
          accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.INST_PARSER_WRONG_RESPONSE_STATUS.name,
          location: moduleName,
          payload: {
            requestParams: _.set(options, 'headers.x-rapidapi-key', '***'),
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
            requestParams: _.set(options, 'headers.x-rapidapi-key', '***'),
            rawResponse: requestRes,
          },
        };

        await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

        return exits.success({
          status: 'error',
          subStatus: 'WrongResponseStatus',
          message: `${moduleName} performed with error`,
          payload: {
            error: 'No "success" key or false',
          },
          raw: requestRes,
        })

      }

      const users = _.get(requestRes, 'data.edges', []);
      const hasNextPage = _.get(requestRes, 'data.page_info.has_next_page', null);
      const endCursor = _.get(requestRes, 'data.page_info.end_cursor', null);

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
          users,
          hasNextPage,
          endCursor,
          requestParams: _.set(options, 'headers.x-rapidapi-key', '***'),
          rawResponse: requestRes,
        },
      };

      await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

      return exits.success({
        status: 'success',
        subStatus: sails.config.custom.HTTP_STATUS_FOUND.message,
        message: `${moduleName} performed`,
        payload: {
          users,
          hasNextPage,
          endCursor,
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
          status: 'error',
          message: `${moduleName} performed`,
          payload: {},
        });
      }
    }

  }

};


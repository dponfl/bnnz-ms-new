"use strict";

const Joi = require('@hapi/joi');
const rp = require('request-promise');
const errors = require('request-promise/errors');
const moment = require('moment');


const moduleName = 'parsers:inst:rapid-api-socialminer:get-user-metadata-joi';


module.exports = {


  friendlyName: 'parsers:inst:rapid-api-socialminer:get-user-metadata-joi',


  description: 'parsers:inst:rapid-api-socialminer:get-user-metadata-joi',


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
      const requestType = 'getUserMetadata';
      let status = '';

      const parserUrl = sails.config.custom.config.parsers.inst.rapidApiSocialminer.url;
      const parserAction = sails.config.custom.config.parsers.inst.rapidApiSocialminer.paths.getUserMetadata;

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

          const statusCode = _.get(reason, 'statusCode', null);

          let performanceCreateParams;

          switch (statusCode) {
            case 404:
              status = 'success';

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
                status: 'success',
                subStatus: sails.config.custom.HTTP_STATUS_NOT_FOUND.message,
                message: `${moduleName} performed`,
                payload: reason,
              };

              break;
            default:
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
          }

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

      if (_.isNil(requestRes.success)) {

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
            error: 'No "success" key',
          },
          raw: requestRes,
        })

      }

      if (!requestRes.success) {

        /**
         * Instagram profile not found (does not exist)
         */

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
            requestParams: _.set(options, 'headers.x-rapidapi-key', '***'),
            rawResponse: requestRes,
          },
        };

        await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

        return exits.success({
          status: 'success',
          subStatus: sails.config.custom.HTTP_STATUS_NOT_FOUND.message,
          message: `${moduleName} performed`,
          payload: requestRes,
          raw: requestRes,
        })

      }

      const userId = _.get(requestRes, 'data.pk', null);
      const userName = _.get(requestRes, 'data.username', null);
      const fullName = _.get(requestRes, 'data.full_name', null);
      const isPrivate = _.get(requestRes, 'data.is_private', null);
      const profilePicUrl = _.get(requestRes, 'data.profile_pic_url', null);
      const isVerified = _.get(requestRes, 'data.is_verified', null);

      if (
        userId == null
        || profilePicUrl == null
      ) {

        status = 'error';
        const momentDone = moment();

        const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

        await LogProcessor.error({
          message: sails.config.custom.INST_PARSER_WRONG_RESPONSE_DATA.message + `: No user id or profile pic url`,
          clientGuid,
          accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.INST_PARSER_WRONG_RESPONSE_DATA.name,
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
          subStatus: 'WrongResponseData',
          message: `${moduleName} performed with error`,
          payload: {
            error: 'No user id or profile pic url',
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
          userId,
          userName,
          fullName,
          isPrivate,
          profilePicUrl,
          isVerified,
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
          userId,
          userName,
          fullName,
          isPrivate,
          profilePicUrl,
          isVerified,
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


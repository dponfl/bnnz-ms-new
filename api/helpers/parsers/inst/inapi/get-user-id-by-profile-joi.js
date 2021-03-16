"use strict";

const Joi = require('@hapi/joi');
const rp = require('request-promise');
const moment = require('moment');


const moduleName = 'parsers:inst:inapi:get-userid-by-profile-joi';


module.exports = {


  friendlyName: 'parsers:inst:inapi:get-userid-by-profile-joi',


  description: 'Получение userId по профилю',


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
      instProfile: Joi
        .string()
        .description('Instagram profile')
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
      const requestType = 'getUserIdByProfile';
      let status = '';

      const momentStart = moment();

      const options = {
        uri: sails.config.custom.config.parsers.inst.inapi.url + sails.config.custom.config.parsers.inst.inapi.paths.getUserId,
        method: 'GET',
        qs: {
          api_key: sails.config.custom.config.parsers.inst.inapi.apiKey,
          username: input.instProfile,
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
          }
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
            error: sails.config.custom.INST_PARSER_WRONG_RESPONSE_STATUS.message,
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

      const userData = _.get(requestRes, 'response.instagram.user', null);

      if (userData === 'not_found') {

        /**
         * От парсера получен адекватный ответ, но пользователь не найден
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
            responseStatusMain,
            responseStatusInner,
            userPk: false,
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
            userPk: false,
          },
          raw: requestRes,
        })

      }

      const userPk = _.get(requestRes, 'response.instagram.user.pk', null);
      const userName = _.get(requestRes, 'response.instagram.user.username', null);
      const fullName = _.get(requestRes, 'response.instagram.user.full_name', null);
      const isPrivate = _.get(requestRes, 'response.instagram.user.is_private', null);
      const profilePicUrl = _.get(requestRes, 'response.instagram.user.profile_pic_url', null);
      const profilePicId = _.get(requestRes, 'response.instagram.user.profile_pic_id', null);
      const isVerified = _.get(requestRes, 'response.instagram.user.is_verified', null);
      const hasAnonymousProfilePicture = _.get(requestRes, 'response.instagram.user.has_anonymous_profile_picture', null);

      // TODO: Добавить обработку ответа, когда парсер возвращает данные,
      // как в Inapi/getUserIdByProfile_not_correct_response.json

      if (
        userPk == null
        || profilePicUrl == null
      ) {

        status = 'error';
        const momentDone = moment();

        const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

        await LogProcessor.error({
          message: sails.config.custom.INST_PARSER_WRONG_RESPONSE_DATA.message,
          clientGuid,
          accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.INST_PARSER_WRONG_RESPONSE_DATA.name,
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
            requestParams: _.omit(options, 'qs.api_key'),
            rawResponse: requestRes,
          },
        };

        await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

        return exits.success({
          status: 'error',
          message: `${moduleName} performed with error`,
          payload: {
            error: 'wrong parser response data',
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
          userPk,
          userName,
          fullName,
          isPrivate,
          profilePicUrl,
          profilePicId,
          isVerified,
          hasAnonymousProfilePicture,
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
          userPk,
          userName,
          fullName,
          isPrivate,
          profilePicUrl,
          profilePicId,
          isVerified,
          hasAnonymousProfilePicture,
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


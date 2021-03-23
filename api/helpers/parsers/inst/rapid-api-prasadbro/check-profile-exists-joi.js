"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment');

const moduleName = 'parsers:inst:rapid-api-prasadbro:check-profile-exists-joi';


module.exports = {


  friendlyName: 'parsers:inst:rapid-api-prasadbro:check-profile-exists-joi',


  description: 'Проверка, что профиль существует в Instagram',


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
      instProfile: Joi
        .string()
        .description('Instagram profile')
        .required(),
    });

    let clientGuid;
    let accountGuid;

    let profileExists = false;
    let profileId = null;
    let profileFullName = null;
    let profilePicUrl = null;
    let profileUserName = null;

    try {

      const input = await schema.validateAsync(inputs.params);

      const client = input.client;
      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      const platform = 'Instagram';
      const action = 'parsing';
      const api = 'rapidApiPrasadbro';
      const requestType = 'checkProfileExists';
      let status = '';

      const momentStart = moment();

      const instProfile = input.instProfile;

      const getUserMetadataParams = {
        client,
        instProfile,
      };

      const getUserMetadataJoiRes = await sails.helpers.parsers.inst.rapidApiPrasadbro.getUserMetadataJoi(getUserMetadataParams);

      if (getUserMetadataJoiRes.status !== 'success') {

        status = 'error';
        const momentDone = moment();

        const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

        await LogProcessor.error({
          message: sails.config.custom.INST_PARSER_GET_USER_METADATA_ERROR_STATUS.message,
          clientGuid,
          accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.INST_PARSER_GET_USER_METADATA_ERROR_STATUS.name,
          location: moduleName,
          payload: {
            getUserMetadataParams: _.omit(getUserMetadataParams, 'client'),
            getUserMetadataJoiRes,
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
            error: sails.config.custom.INST_PARSER_GET_USER_METADATA_ERROR_STATUS.message,
            getUserMetadataParams: _.omit(getUserMetadataParams, 'client'),
            getUserMetadataJoiRes,
          },
        };

        await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

        return exits.success({
          status: 'error',
          message: `${moduleName} performed with error`,
          payload: {
            error: sails.config.custom.INST_PARSER_GET_USER_METADATA_ERROR_STATUS.message,
          },
          raw: getUserMetadataJoiRes,
        })

      }

      const subStatus = _.get(getUserMetadataJoiRes, 'subStatus', null);

      if (subStatus === sails.config.custom.HTTP_STATUS_NOT_FOUND.message) {

        profileExists = false;

      } else if (subStatus === sails.config.custom.HTTP_STATUS_FOUND.message) {

        profileExists = true;
        profileId = _.get(getUserMetadataJoiRes, 'payload.userId', null);
        profileFullName = _.get(getUserMetadataJoiRes, 'payload.fullName', null);
        profileUserName = _.get(getUserMetadataJoiRes, 'payload.userName', null);
        profilePicUrl = _.get(getUserMetadataJoiRes, 'payload.profilePicUrl', null);

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
          profileExists,
          profileId,
          profileUserName,
          profilePicUrl,
          profileFullName,
        },
      };

      await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

      return exits.success({
        status: 'success',
        message: `${moduleName} performed`,
        payload: {
          profileExists,
          profileId,
          profileUserName,
          profileFullName,
          profilePicUrl,
        },

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


"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment');

const moduleName = 'parsers:inst:inapi:check-profile-exists-joi';


module.exports = {


  friendlyName: 'parsers:inst:inapi:check-profile-exists-joi',


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


    try {

      const input = await schema.validateAsync(inputs.params);

      const client = input.client;
      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      const platform = 'Instagram';
      const action = 'parsing';
      const api = 'inapi';
      const requestType = 'checkProfileExists';
      let status = '';

      const momentStart = moment();

      const instProfile = input.instProfile;

      const getUserIdByProfileJoiParams = {
        client,
        instProfile,
      };

      const getUserIdByProfileJoiRes = await sails.helpers.parsers.inst.inapi.getUserIdByProfileJoi(getUserIdByProfileJoiParams);

      if (getUserIdByProfileJoiRes.status !== 'success') {

        status = 'error';
        const momentDone = moment();

        const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

        await LogProcessor.error({
          message: sails.config.custom.INST_PARSER_WRONG_GET_USER_ID_BY_PROFILE_STATUS.message,
          clientGuid,
          accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.INST_PARSER_WRONG_GET_USER_ID_BY_PROFILE_STATUS.name,
          location: moduleName,
          payload: getUserIdByProfileJoiRes,
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
            error: 'wrong getUserIdByProfileJoi response status',
            response: getUserIdByProfileJoiRes.raw || {},
          },
        };

        await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

        return exits.success({
          status: 'error',
          message: `${moduleName} performed with error`,
          payload: {
            error: 'wrong getUserIdByProfileJoi response status',
          },
          raw: getUserIdByProfileJoiRes,
        })

      }

      const userPk = _.get(getUserIdByProfileJoiRes, 'payload.userPk', false);
      const profileExists = !!userPk;
      const profileId = _.get(getUserIdByProfileJoiRes, 'payload.userPk', null);
      const profileFullName = _.get(getUserIdByProfileJoiRes, 'payload.fullName', null);
      const profilePicUrl = _.get(getUserIdByProfileJoiRes, 'payload.profilePicUrl', null);

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
          profilePicUrl,
        },
      };

      await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);


      return exits.success({
        status: 'success',
        message: `${moduleName} performed`,
        payload: {
          profileExists,
          profileId,
          profileFullName,
          profilePicUrl,
        },

      })


    } catch (e) {

      // const errorLocation = moduleName;
      // const errorMsg = `${moduleName}: General error`;
      //
      // await LogProcessor.error({
      //   message: e.message || errorMsg,
      //   clientGuid,
      //   accountGuid,
      //   // requestId: null,
      //   // childRequestId: null,
      //   errorName: e.name || 'none',
      //   location: errorLocation,
      //   payload: e.raw || {},
      // });
      //
      // return exits.success({
      //   status: 'error',
      //   module: errorLocation,
      //   message: errorMsg,
      //   payload: {
      //     error: e.raw || {},
      //   },
      // })

      // return await sails.helpers.general.catchErrorJoi({
      //   error: e,
      //   location: moduleName,
      //   throwError: false,
      // });

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


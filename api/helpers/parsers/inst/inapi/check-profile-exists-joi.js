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


    try {

      const input = await schema.validateAsync(inputs.params);

      const client = input.client;
      const clientGuid = input.client.guid;
      const accountGuid = input.client.account_use;

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
        // throw new Error(`${moduleName}, error: wrong getUserIdByProfileJoi response
        // getUserIdByProfileJoiParams: ${JSON.stringify(getUserIdByProfileJoiParams, null, 3)}
        // getUserIdByProfileJoiRes: ${JSON.stringify(getUserIdByProfileJoiRes, null, 3)}`);

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
          comments: getUserIdByProfileJoiRes.raw || {},
        };

        await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

        return exits.success({
          status: 'error',
          message: `${moduleName} performed with error`,
          payload: {},
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
        // comments: getUserIdByProfileJoiRes.raw || {},
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


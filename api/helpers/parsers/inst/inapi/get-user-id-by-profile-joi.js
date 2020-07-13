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
    }

  },


  fn: async function (inputs, exits) {

    const schema = Joi.object({
      instProfile: Joi
        .string()
        .description('Instagram profile')
        .required(),
    });


    try {

      const input = await schema.validateAsync(inputs.params);

      const platform = 'Instagram';
      const action = 'parsing';
      const api = 'inapi';
      const requestType = 'getUserIdByProfile';
      const momentStart = moment();

      const options = {
        uri: sails.config.custom.instParserUrl + sails.config.custom.config.parsers[sails.config.custom.config.parsers.inst].paths.getUserId,
        method: 'GET',
        qs: {
          api_key: sails.config.custom.instParserApiKey,
          username: input.instProfile,
        },
        json: true,
      };

      const requestRes = await rp(options);

      const responseStatusMain = _.get(requestRes, 'status', null);
      const responseStatusInner = _.get(requestRes, 'response.status', null);

      if (responseStatusMain !== 'success' || responseStatusInner !== 'success') {
        throw new Error(`${moduleName}, error => wrong parser response:
        request params: ${JSON.stringify(options, null, 3)}
        request response: ${JSON.stringify(requestRes, null, 3)}`);
      }

      const userPk = _.get(requestRes, 'response.instagram.user.pk', null);
      const userName = _.get(requestRes, 'response.instagram.user.username', null);
      const fullName = _.get(requestRes, 'response.instagram.user.full_name', null);
      const isPrivate = _.get(requestRes, 'response.instagram.user.is_private', null);
      const profilePicUrl = _.get(requestRes, 'response.instagram.user.profile_pic_url', null);
      const profilePicId = _.get(requestRes, 'response.instagram.user.profile_pic_id', null);
      const isVerified = _.get(requestRes, 'response.instagram.user.is_verified', null);
      const hasAnonymousProfilePicture = _.get(requestRes, 'response.instagram.user.has_anonymous_profile_picture', null);

      const momentDone = moment();

      const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

      const performanceCreateParams = {
        platform,
        action,
        api,
        requestType,
        requestDuration,
      };

      await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

      return exits.success({
        status: 'ok',
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


"use strict";

const Joi = require('@hapi/joi');

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
      instProfile: Joi
        .string()
        .description('Instagram profile')
        .required(),
    });


    try {

      const input = await schema.validateAsync(inputs.params);

      const instProfile = input.instProfile;

      const getUserIdByProfileJoiParams = {
        instProfile,
      };

      const getUserIdByProfileJoiRes = await sails.helpers.parsers.inst.inapi.getUserIdByProfileJoi(getUserIdByProfileJoiParams);

      if (getUserIdByProfileJoiRes.status !== 'ok') {
        throw new Error(`${moduleName}, error: wrong getUserIdByProfileJoi response
        getUserIdByProfileJoiParams: ${JSON.stringify(getUserIdByProfileJoiParams, null, 3)}
        getUserIdByProfileJoiRes: ${JSON.stringify(getUserIdByProfileJoiRes, null, 3)}`);
      }

      const userPk = _.get(getUserIdByProfileJoiRes, 'payload.userPk', false);
      const profileExists = !!userPk;
      const profileId = _.get(getUserIdByProfileJoiRes, 'payload.userPk', null);
      const profileFullName = _.get(getUserIdByProfileJoiRes, 'payload.fullName', null);
      const profilePicUrl = _.get(getUserIdByProfileJoiRes, 'payload.profilePicUrl', null);

      return exits.success({
        status: 'ok',
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


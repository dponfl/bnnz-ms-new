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


    let profileExists = false;
    let profileId = null;
    let profilePic = null;

    try {

      const input = await schema.validateAsync(inputs.params);

      /**
       * Заглушка (должна быть заменена на обращение к API парсера
       */

      profileExists = true;


      return exits.success(profileExists);

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {
          profileExists,
          profileId,
          profilePic,
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


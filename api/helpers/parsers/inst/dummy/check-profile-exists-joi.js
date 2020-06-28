"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'parsers:inst:ninja:check-profile-exists-joi';


module.exports = {


  friendlyName: 'parsers:inst:ninja:check-profile-exists-joi',


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

    try {

      const input = await schema.validateAsync(inputs.params);

      /**
       * Заглушка (должна быть заменена на обращение к API парсера
       */

      profileExists = true;


      return exits.success(profileExists);

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


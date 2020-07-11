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

      const userPk = "25025320";
      const profileExists = !!userPk;
      const profileId = "25025320";
      const profileFullName = "Instagram";
      const profilePicUrl = "https://scontent-arn2-1.cdninstagram.com/v/t51.2885-19/s150x150/101703932_264332984810770_2870985139712688128_n.jpg?_nc_ht=scontent-arn2-1.cdninstagram.com&_nc_ohc=JD-tA9Oeep8AX_e6dln&oh=b032c0b0eebad1109ce46d31ebcc80b9&oe=5F347BFD";

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


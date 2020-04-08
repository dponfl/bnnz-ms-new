"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'parsers:inst:ninja:check-likes-comments-joi';


module.exports = {


  friendlyName: 'parsers:inst:ninja:check-likes-comments-joi',


  description: 'Проверка постановки лайка и оставления комментария',


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
      instProfile: Joi.string().required(),
      instPostCode: Joi.string().required(),
    });


    let likeMade = false;
    let commentMade = false;
    let commentText = '';

    try {

      const input = await schema.validateAsync(inputs.params);

      /**
       * Заглушка (должна быть заменена на обращение к API парсера
       */

      likeMade = true;
      commentMade = true;
      commentText = 'Пример комментария на пост';


      return exits.success({
        likeMade,
        commentMade,
        commentText,
      });

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


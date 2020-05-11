"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'parsers:inst:ninja:check-profile-subscription-joi';


module.exports = {


  friendlyName: 'parsers:inst:ninja:check-profile-subscription-joi',


  description: 'Проверка, что один профиль подписан на другие профили',


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
      checkProfile: Joi
        .string()
        .description('Instagram profile to check subscription')
        .required(),
      profilesList: Joi
        .any()
        .description('list of Instagram profile to check subscription on')
        .required(),
      flag: Joi
        .number()
        .description('number of profiles to decline'),
    });


    let result;

    try {

      const input = await schema.validateAsync(inputs.params);

      /**
       * Заглушка (должна быть заменена на обращение к API парсера
       */

      const notSubscribed = [];
      const subscribed = input.profilesList;

      let allSubscribed;

      if (input.flag != null && input.flag > 0) {
        allSubscribed = false;

        for (let i = 0; i < input.flag; i++) {
          const randomIndex = _.random(0, input.profilesList.length - 1);
          notSubscribed.push(input.profilesList[randomIndex]);
          _.pull(subscribed, input.profilesList[randomIndex]);
        }

      } else {
        allSubscribed = true;
      }

      result = {
        allSubscribed,
        notSubscribed,
        subscribed,
      };


      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: result,
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


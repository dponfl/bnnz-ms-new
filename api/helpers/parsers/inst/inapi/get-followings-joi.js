"use strict";

const Joi = require('@hapi/joi');
const rp = require('request-promise');


const moduleName = 'parsers:inst:inapi:get-followings-joi';


module.exports = {


  friendlyName: 'parsers:inst:inapi:get-followings-joi',


  description: 'Получение списка подписок профиля',


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
      profilePk: Joi
        .string()
        .description('Instagram user PK')
        .required(),
      limit: Joi
        .number()
        .description('Limitation of response length: limit=1 means 50 records')
        .integer()
        .positive()
        .required(),
    });


    try {

      const input = await schema.validateAsync(inputs.params);

      const options = {
        uri: sails.config.custom.instParserUrl + sails.config.custom.config.parsers[sails.config.custom.config.parsers.inst].paths.getFollowing,
        method: 'GET',
        qs: {
          api_key: sails.config.custom.instParserApiKey,
          user_id: input.profilePk,
          limit: input.limit,
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

      const users = _.get(requestRes, 'response.instagram.result.users', null);

      if (users == null) {
        throw new Error(`${moduleName}, error => wrong parser response: no users
        request params: ${JSON.stringify(options, null, 3)}
        request response: ${JSON.stringify(requestRes, null, 3)}`);
      }

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {
          users,
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


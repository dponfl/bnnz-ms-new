"use strict";

const Joi = require('@hapi/joi');
const rp = require('request-promise');


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

    let userId = null;


    try {

      const input = await schema.validateAsync(inputs.params);

      const options = {
        uri: sails.config.custom.instParserUrl + sails.config.custom.config.parsers[sails.config.custom.config.parsers.inst].getUserId,
        qs: {
          api_key: sails.config.custom.instParserApiKey,
          username: input.instProfile,
        },
        json: true,
      };

      rp(options)
        .then((res) => {

        })
        .catch((err) => {
          throw new Error(`${moduleName}, REST API request error:
          error: ${JSON.stringify(err, null, 3)}`);
        });

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {
          userId,
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


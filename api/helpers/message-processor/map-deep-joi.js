"use strict";

const Joi = require('@hapi/joi');

const t = require('../../services/translate').t;

const moduleName = 'message-processor:map-deep-joi';


module.exports = {


  friendlyName: 'message-processor:map-deep-joi',


  description: 'Map message objects in depth',


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
      client: Joi.any().required(),
      data: Joi.any().required(),
    });

    try {

      const input = await schema.validateAsync(inputs.params);

      if (_.isArray(input.data)) {
        const arr = input.data.map(async (innerObj) => await sails.helpers.messageProcessor.mapDeepJoi({
          client: input.client,
          data: innerObj,
        }));

        return exits.success(arr);

      } else if (_.isObject(input.data)) {
        let ob = _.forEach(input.data, async (val, key, o) => {
          if (key === 'text') {
            o[key] = await sails.helpers.messageProcessor.parseSpecialTokensJoi({
              client: input.client,
              message: t(input.client.lang, val),
            });
          }
        });

        return exits.success(ob);

      }

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
        }
      };

    }

  }

};


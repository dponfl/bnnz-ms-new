"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:silver-personal:optin:block-modify-confirm-profile';


module.exports = {


  friendlyName: 'funnel:silver-personal:optin:block-modify-confirm-profile',


  description: 'funnel:silver-personal:optin:block-modify-confirm-profile',


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
      client: Joi
        .any()
        .description('Client record')
        .required(),
      block: Joi
        .any()
        .description('Current funnel block')
        .required(),
      msg: Joi
        .any()
        .description('Message received'),
      payload: Joi
        .any()
        .description('{text, inline_keyboard} object')
        .required(),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      const instProfile = sails.config.custom.config.general.instagram_prefix + _.trim(input.client.inst_profile_tmp);

      const resHtml = _.replace(input.payload.text, '$instagramProfile$', instProfile);

      return exits.success({
        text: resHtml,
        inline_keyboard: input.payload.inline_keyboard,
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


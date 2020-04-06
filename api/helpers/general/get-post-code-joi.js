"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'general:get-post-code-joi';


module.exports = {


  friendlyName: 'general:get-post-code-joi',


  description: 'Pick a post code from the post url',


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

    let postCode = null;

    const schema = Joi.object({
      postLink: Joi.string()
        .pattern(RegExp(sails.config.custom.postRegExp)).required(),
    });

    try {

      const input = await schema.validateAsync(inputs.params);

      const escapedRegExp = new RegExp(sails.config.custom.postRegExp);
      const regExp = new RegExp(escapedRegExp);

      const postCodeRaw = regExp.exec(input.postLink);

      if (postCodeRaw.length !== 3) {
        throw new Error(`${moduleName}, Error: postLink has wrong format: ${input.postLink}`);
      }

      postCode = postCodeRaw[2];

      if (postCode === '') {
        throw new Error(`${moduleName}, Error: postCode is empty. postCodeRaw: \n${JSON.stringify(postCodeRaw, null, 3)}`);
      }

      return exits.success(postCode);

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


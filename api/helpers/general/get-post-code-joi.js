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
        // throw new Error(`${moduleName}, Error: postLink has wrong format: ${input.postLink}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.WARN,
          location: moduleName,
          message: 'postLink has wrong format',
          errorName: sails.config.custom.GENERAL_ERROR,
          payload: {
            postLink: input.postLink,
          },
        });

      }

      // postCode = postCodeRaw[2];
      postCode = _.replace(postCodeRaw[2], '/', '');

      if (postCode === '') {
        // throw new Error(`${moduleName}, Error: postCode is empty. postCodeRaw: \n${JSON.stringify(postCodeRaw, null, 3)}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.WARN,
          location: moduleName,
          message: 'postCode is empty',
          errorName: sails.config.custom.GENERAL_ERROR,
          payload: {
            postCodeRaw,
          },
        });

      }

      return exits.success(postCode);

    } catch (e) {

      // const errorLocation = moduleName;
      // const errorMsg = `${moduleName}: General error`;
      //
      // sails.log.error(errorLocation + ', error: ' + errorMsg);
      // sails.log.error(errorLocation + ', error details: ', e);
      //
      // throw {err: {
      //     module: errorLocation,
      //     message: errorMsg,
      //     payload: {
      //       error: e,
      //     },
      //   }
      // };

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
        });
        return exits.success({
          status: 'ok',
          message: `${moduleName} performed`,
          payload: {},
        });
      }

    }

  }

};


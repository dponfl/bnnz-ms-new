"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:silver_personal:optin:forced-get-profile-joi';


module.exports = {


  friendlyName: 'funnel:silver_personal:optin:forced-get-profile-joi',


  description: 'funnel:silver_personal:optin:forced-get-profile-joi',


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
        .description('Message received')
        .required(),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      if (_.trim(input.msg.text) === '') {

        /**
         * No Instagram profile entered
         */

        input.block.done = true;
        input.block.next = 'optin::wrong_profile';

      } else {

        let instProfile = _.toLower(_.trim(input.msg.text));

        if (instProfile[0] === '@') {
          instProfile = _.replace(instProfile, '@', '');
        }

        input.client.inst_profile_tmp = instProfile;

        input.block.done = true;
        input.block.next = 'optin::check_profile';

      }

      await sails.helpers.funnel.afterHelperGenericJoi({
        client: input.client,
        block: input.block,
        msg: input.msg,
        next: true,
        previous: true,
        switchFunnel: true,
        createdBy: moduleName,
      });


      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
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


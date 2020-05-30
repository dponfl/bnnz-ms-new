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

      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});
      const currentAccountInd = _.findIndex(input.client.accounts, (o) => {
        return o.guid === currentAccount.guid;
      });

      if (_.trim(input.msg.text) === '') {

        /**
         * No Instagram profile entered
         */

        input.block.done = true;
        input.block.next = 'optin::wrong_profile';

      } else {

        /**
         * Парсером проверяем, что этот профиль существует в Instagram
         */

        let instProfile = _.trim(input.msg.text);

        if (instProfile[0] === '@') {
          instProfile = _.replace(instProfile, '@', '');
        }

        const activeParser = sails.config.custom.config.parsers.inst;

        const profileExists = await sails.helpers.parsers.inst[activeParser].checkProfileExistsJoi({
          instProfile,
        });

        if (profileExists) {

          input.client.inst_profile_tmp = instProfile;
          input.client.accounts[currentAccountInd].profile_provided = true;

          input.block.done = true;
          input.block.next = 'optin::confirm_profile';

        } else {

          input.block.done = true;
          input.block.next = 'optin::wrong_profile';

        }

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


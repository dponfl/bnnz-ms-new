"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:silver-personal:optin:after-check-profile-joi';


module.exports = {


  friendlyName: 'funnel:silver-personal:optin:after-check-profile-joi',


  description: 'funnel:silver-personal:optin:after-check-profile-joi',


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
    });

    let input;

    let checkProfileRaw;
    let parserStatus = '';
    let parserRequestPerformed = false;
    const parserRequestIntervals = sails.config.custom.config.parsers.inst.errorSteps.intervals;
    const parserRequestIntervalTime = sails.config.custom.config.parsers.inst.errorSteps.intervalTime;

    let profileExists = false;
    let profileId = null;
    let profilePic = null;


    let updateBlock;
    let getBlock;
    let splitRes;
    let updateFunnel;
    let updateId;

    try {

      input = await schema.validateAsync(inputs.params);

      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});
      const client = input.client;

      const instProfile = input.client.inst_profile_tmp;
      const activeParser = sails.config.custom.config.parsers.inst.activeParserName;

      /**
       * Парсером проверяем, что этот профиль существует в Instagram
       */


      let i = 0;

      while (parserStatus !== 'success' && i < parserRequestIntervals.length) {

        checkProfileRaw = await sails.helpers.parsers.inst[activeParser].checkProfileExistsJoi({
          client,
          instProfile,
        });

        parserStatus = getUserIdByProfileJoiRes.status;

      }

      if (parserStatus === 'success') {

        profileExists = checkProfileRaw.payload.profileExists;
        profileId = checkProfileRaw.payload.profileId;
        profilePic = checkProfileRaw.payload.profilePicUrl;

        if (profileExists) {

          currentAccount.profile_provided = true;
          currentAccount.inst_id = profileId;
          currentAccount.inst_pic = profilePic;

          input.block.done = true;
          input.block.next = 'optin::confirm_profile';

        } else {

          input.client.inst_profile_tmp = null;
          input.block.done = true;
          input.block.next = 'optin::wrong_profile';

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

      } else {

        /**
         * Успешный ответ от парсера так и не был получен
         */

        sails.log.error(`${moduleName}: Успешный ответ от парсера так и не был получен`);

      }

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      })

    } catch (e) {

      const errorMsg = 'General error';

      sails.log.error(`${moduleName}, Error details:
      Platform error message: ${errorMsg}
      Error name: ${e.name || 'no name'}
      Error message: ${e.message || 'no message'}
      Error stack: ${JSON.stringify(e.stack || {}, null, 3)}`);

      throw {err: {
          module: `${moduleName}`,
          message: errorMsg,
          payload: {
            error_name: e.name || 'no name',
            error_message: e.message || 'no message',
            error_stack: e.stack || {},
          },
        }
      };

    }

  }

};


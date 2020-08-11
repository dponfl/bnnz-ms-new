"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'general:check-day-posts-joi';


module.exports = {


  friendlyName: 'Check day posts',


  description: 'Check if the client reached the day limit for sending posts',


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
    });

    let input;

    let clientGuid;
    let accountGuid;


    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;


      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});

      if (currentAccount == null) {
        // throw new Error(`${moduleName}, error: Cannot find account by client.account_use:
        // client.account_use: ${input.client.account_use}
        // client.accounts: ${JSON.stringify(input.client.accounts, null, 3)}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Cannot find account by client.account_use',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR,
          payload: {
            account_use: input.client.account_use,
            accounts: input.client.accounts,
          },
        });

      }

      return exits.success({
        status: 'ok',
        message: '',
        payload: {
          dayPostsReached: currentAccount.posts_made_day >= currentAccount.service.max_outgoing_posts_day,
        }
      });

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


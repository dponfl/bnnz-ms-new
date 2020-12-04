"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:common:optin:after-optin-completed-joi';


module.exports = {


  friendlyName: 'funnel:common:optin:after-optin-completed-joi',


  description: 'funnel:common:optin:after-optin-completed-joi',


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

    let clientGuid;
    let accountGuid;


    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;


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

      // const errorMsg = 'General error';
      //
      // sails.log.error(`${moduleName}, Error details:
      // Platform error message: ${errorMsg}
      // Error name: ${e.name || 'no name'}
      // Error message: ${e.message || 'no message'}
      // Error stack: ${JSON.stringify(e.stack || {}, null, 3)}`);
      //
      // throw {err: {
      //     module: `${moduleName}`,
      //     message: errorMsg,
      //     payload: {
      //       error_name: e.name || 'no name',
      //       error_message: e.message || 'no message',
      //       error_stack: e.stack || {},
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


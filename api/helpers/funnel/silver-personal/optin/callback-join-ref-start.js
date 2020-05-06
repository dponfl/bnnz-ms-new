"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:silver-personal:optin:callback-join-ref-start';


module.exports = {


  friendlyName: 'funnel:silver-personal:optin:callback-join-ref-start',


  description: 'funnel:silver-personal:optin:callback-join-ref-start',


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
      query: Joi
        .any()
        .description('Callback query received')
        .required(),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});
      const currentAccountInd = _.findIndex(input.client.accounts, (o) => {
        return o.guid === currentAccount.guid;
      });

      switch (input.query.data) {
        case 'join':
          input.client.accounts[currentAccountInd].is_ref = true;

          /**
           * "Прописываем" currentAccount в реферальную систему
           */

          await sails.helpers.ref.linkAccountToRef.with({
            account: currentAccount,
          });

          input.block.next = 'optin::join_ref_subscribe';
          break;
        case 'not_join':
          input.block.next = 'optin::join_ref_no';
          break;
        case 'need_more_info':
          input.block.next = 'optin::join_ref_more_info_first';
          break;
        default:
          throw new Error(`${moduleName}, error: Wrong callback data: ${input.query.data}`);
      }

      input.block.done = true;

      await sails.helpers.funnel.afterHelperGenericJoi({
        client: input.client,
        block: input.block,
        msg: input.query,
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


"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:silver-personal:optin:after-optin-completed-joi';


module.exports = {


  friendlyName: 'funnel:silver-personal:optin:after-optin-completed-joi',


  description: 'funnel:silver-personal:optin:after-optin-completed-joi',


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

    try {

      input = await schema.validateAsync(inputs.params);

      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});
      const currentAccountInd = _.findIndex(input.client.accounts, (o) => {
        return o.guid === currentAccount.guid;
      });

      currentAccount.subscription_made = true;
      currentAccount.service_subscription_finalized = true;
      currentAccount.subscription_active = true;
      currentAccount.keyboard = "main::place_post";

      input.block.shown = true;
      input.block.done = true;

      await sails.helpers.storage.clientUpdateJoi({
        criteria: {guid: input.client.guid},
        data: input.client,
        createdBy: `${moduleName}`,
      });

      const sendKeyboardForAccountParams = {
        client: input.client,
      };

      const sendKeyboardForAccountRaw = await sails.helpers.keyboardProcessor.sendKeyboardForAccountJoi(sendKeyboardForAccountParams);

      if (sendKeyboardForAccountRaw.status !== 'ok') {
        throw new Error(`${moduleName}, error: wrong sendKeyboardForAccountJoi response
        sendKeyboardForAccountParams: ${JSON.stringify(sendKeyboardForAccountParams, null, 3)}
        sendKeyboardForAccountRaw: ${JSON.stringify(sendKeyboardForAccountRaw, null, 3)}`);
      }

      // await sails.helpers.funnel.afterHelperGenericJoi({
      //   client: input.client,
      //   block: input.block,
      //   msg: input.msg,
      //   next: true,
      //   previous: true,
      //   switchFunnel: true,
      //   createdBy: moduleName,
      // });

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


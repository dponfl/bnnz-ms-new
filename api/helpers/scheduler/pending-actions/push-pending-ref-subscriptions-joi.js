"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'scheduler:pending-actions:push-pending-ref-subscriptions-joi';


module.exports = {


  friendlyName: 'scheduler:pending-actions:push-pending-ref-subscriptions-joi',


  description: 'scheduler:pending-actions:push-pending-ref-subscriptions-joi',


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
      someOne: Joi
        .any()
        .description('XXX')
        .required(),
      someTwo: Joi
        .any()
        .description('XXX')
        .required(),
      someThree: Joi
        .any()
        .description('XXX'),
    });

    let input;

    let clientGuid;
    let accountGuid;


    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});
      const currentAccountInd = _.findIndex(input.client.accounts, (o) => {
        return o.guid === currentAccount.guid;
      });

      throw new Error(`${moduleName}, error: xxxxxxxxx: \n${JSON.stringify(input.client, null, 3)}`);

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      })

    } catch (e) {

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

async function processPendingRefSubscription(client, account, pendingSubscription) {



}


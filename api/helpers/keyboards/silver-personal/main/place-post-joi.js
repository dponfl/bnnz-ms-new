"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'keyboards:silver-personal:main:place-post-joi';


module.exports = {


  friendlyName: 'keyboards:silver-personal:main:place-post-joi',


  description: 'keyboards:silver-personal:main:place-post-joi',


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
        .description('client object')
        .required(),
    });

    let input;
    let currentAccount;

    try {

      input = await schema.validateAsync(inputs.params);

      currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});
      const currentAccountInd = _.findIndex(input.client.accounts, (o) => {
        return o.guid === currentAccount.guid;
      });

      /**
       * Update General funnel to the initial state to enable the client to perform it again
       */

      const loadInitialFunnelsJoiParams = {
        client: input.client,
        clientCategory: input.client.accounts[currentAccountInd]['service']['funnel_name'],
        funnelName: 'main',
      };

      const loadInitialFunnelsJoiRaw = await sails.helpers.general.loadInitialFunnelsJoi(loadInitialFunnelsJoiParams);

      if (loadInitialFunnelsJoiRaw.status !== 'ok') {
        throw new Error(`${moduleName}, error: wrong loadInitialFunnelsJoi response:
              loadInitialFunnelsJoiParams: ${JSON.stringify(loadInitialFunnelsJoiParams, null, 3)}
              loadInitialFunnelsJoiRaw: ${JSON.stringify(loadInitialFunnelsJoiRaw, null, 3)}`);
      }

      input.client = loadInitialFunnelsJoiRaw.payload.client;

      currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});

      currentAccount.keyboard = null;



      const initialBlock = _.find(input.client.funnels[input.client.current_funnel],
        {initial: true});

      initialBlock.enabled = true;

      await sails.helpers.funnel.proceedNextBlockJoi({
        client: input.client,
        funnelName: input.client.current_funnel,
        blockId: "provide_post_link",
        createdBy: moduleName,
      });



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


"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'keyboards:silver-personal:ref-profile-subscription-check:check-profiles-subscription-joi';


module.exports = {


  friendlyName: 'keyboards:silver-personal:ref-profile-subscription-check:check-profiles-subscription-joi',


  description: 'keyboards:silver-personal:ref-profile-subscription-check:check-profiles-subscription-joi',


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
      const currentAccountInd = _.findIndex(input.client.accounts, (o) => {
        return o.guid === currentAccount.guid;
      });

      /**
       * Update refProfileSubscriptionCheck funnel to the initial state to enable the client to perform it again
       */

      const loadInitialFunnelsJoiParams = {
        client: input.client,
        clientCategory: input.client.accounts[currentAccountInd]['service']['funnel_name'],
        funnelName: 'refProfileSubscriptionCheck',
      };

      const loadInitialFunnelsJoiRaw = await sails.helpers.general.loadInitialFunnelsJoi(loadInitialFunnelsJoiParams);

      if (loadInitialFunnelsJoiRaw.status !== 'ok') {

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Wrong loadInitialFunnelsJoi response',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.KEYBOARDS_ERROR.name,
          payload: {
            loadInitialFunnelsJoiParams,
            loadInitialFunnelsJoiRaw,
          },
        });

      }

      input.client = loadInitialFunnelsJoiRaw.payload.client;

      currentAccount.keyboard = null;

      /**
       * Установить в client, что выполняется воронка "refProfileSubscriptionCheck"
       */

      input.client.current_funnel = 'refProfileSubscriptionCheck';

      const initialBlock = _.find(input.client.funnels[input.client.current_funnel],
        {initial: true});

      initialBlock.enabled = true;

      await sails.helpers.funnel.proceedNextBlockJoi({
        client: input.client,
        funnelName: input.client.current_funnel,
        blockId: "join_ref_check",
        createdBy: moduleName,
      });



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
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
          }
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
          }
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


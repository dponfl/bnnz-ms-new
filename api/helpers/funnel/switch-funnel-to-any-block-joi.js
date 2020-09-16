"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:switch-funnel-to-any-block-joi';


module.exports = {


  friendlyName: 'funnel:switch-funnel-to-any-block-joi',


  description: 'funnel:switch-funnel-to-any-block-joi',


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
        .description('client record')
        .required(),
      funnelName: Joi
        .string()
        .description('funnel name to switch to')
        .required(),
      blockId: Joi
        .string()
        .description('blockId to switch to')
        .required(),
      skipBlocks: Joi
        .any()
        .description('array of blockIds to mark as done/shown')
        .required(),
      createdBy: Joi
        .string()
        .description('createdBy'),
    });

    let input;

    let client;

    let clientGuid;
    let accountGuid;

    let currentAccount;
    let currentAccountInd;


    try {

      input = await schema.validateAsync(inputs.params);

      client = input.client;
      clientGuid = client.guid;
      accountGuid = client.account_use;

      currentAccount = _.find(client.accounts, {guid: client.account_use});
      currentAccountInd = _.findIndex(client.accounts, (o) => {
        return o.guid === currentAccount.guid;
      });

      /**
       * Загрузить девственную версию воронки для перехода
       */

      const loadInitialFunnelsJoiParams = {
        client,
        clientCategory: client.accounts[currentAccountInd]['service']['funnel_name'],
        funnelName: input.funnelName,
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

      /**
       * Установить в client, что выполняется воронка "input.funnelName"
       */

      client.funnels = loadInitialFunnelsJoiRaw.payload.client.funnels;

      currentAccount.keyboard = null;

      client.current_funnel = input.funnelName;

      /**
       * Промаркировать блоки, которые не нужно выполнять
       */

      _.forEach(input.skipBlocks, (skipBlockId) => {
        const skipBlock = _.find(client.funnels[input.funnelName], {id: skipBlockId});
        if (skipBlock != null) {
          skipBlock.done = true;
          skipBlock.shown = true;
        }
      });

      /**
       * Активировать блок input.blockId
       */

      const activateBlock = _.find(client.funnels[input.funnelName], {id: input.blockId});

      if (activateBlock == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'Block not found',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR.name,
          payload: {
            blockId: input.blockId,
            funnel: client.funnels[input.funnelName],
          },
        });
      }

      activateBlock.enabled = true;
      activateBlock.done = false;
      activateBlock.shown = false;

      await sails.helpers.storage.clientUpdateJoi({
        criteria: {guid: client.guid},
        data: client,
        createdBy: `${input.createdBy} => ${moduleName}`,
      });


      await sails.helpers.funnel.proceedNextBlockJoi({
        client,
        funnelName: client.current_funnel,
        blockId: input.blockId,
        createdBy: `${input.createdBy} => ${moduleName}`,
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
          },
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
          },
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


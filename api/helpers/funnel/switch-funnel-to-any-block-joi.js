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
      serviceName: Joi
        .string()
        .description('service name (e.g. silver_personal)')
        .required(),
      funnelName: Joi
        .string()
        .description('funnel (e.g. optin)')
        .required(),
      blockId: Joi
        .string()
        .description('blockId to switch to')
        .required(),
      skipBlocks: Joi
        .array()
        .description('array of block objects to update')
        .items(Joi
          .object({
            id: Joi
              .string()
              .required(),
            initial: Joi
              .boolean()
              .default(false),
            enabled: Joi
              .boolean()
              .default(true),
            previous: Joi
              .alternatives()
              .try(
                Joi.string(),
                Joi.any().allow(null),
              )
              .required(),
            next: Joi
              .alternatives()
              .try(
                Joi.string(),
                Joi.any().allow(null),
              )
              .required(),
            switchToFunnel: Joi
              .alternatives()
              .try(
                Joi.string(),
                Joi.any().allow(null),
              )
              .required(),
            shown: Joi
              .boolean()
              .default(true),
            done: Joi
              .boolean()
              .default(true),
          }))
        .required(),
      proceedNextBlock: Joi
        .boolean()
        .description('flag if to proceed next block')
        .default(true),
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

    let clientCategory;


    try {

      input = await schema.validateAsync(inputs.params);

      client = input.client;
      clientGuid = client.guid;
      accountGuid = client.account_use;

      currentAccount = _.find(client.accounts, {guid: client.account_use});
      currentAccountInd = _.findIndex(input.client.accounts, (o) => {
        return o.guid === currentAccount.guid;
      });

      /**
       * Обновить данные по уровню сервиса для аккаунта client.account_use
       */

      const getServiceRes = await sails.helpers.storage.getService.with({serviceName: input.serviceName});

      // client.accounts[currentAccountInd].service = getServiceRes.payload.id;
      client.accounts[currentAccountInd].service = getServiceRes.payload;

      clientCategory = getServiceRes.payload.funnel_name;

      /**
       * Загрузить девственную версию воронки для перехода
       */

      const loadInitialFunnelsJoiParams = {
        client,
        clientCategory,
      };

      const loadInitialFunnelsJoiRaw = await sails.helpers.general.loadInitialFunnelsAllJoi(loadInitialFunnelsJoiParams);

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

      client.funnel_name = clientCategory;
      client.current_funnel = input.funnelName;

      /**
       * Update блоки, которые не нужно выполнять, используя переданные данные
       */

      _.forEach(input.skipBlocks, (skipBlockObj) => {
        const skipBlock = _.find(client.funnels[input.funnelName], {id: skipBlockObj.id});
        _.assign(skipBlock, skipBlockObj);
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


      if (input.proceedNextBlock) {
        await sails.helpers.funnel.proceedNextBlockJoi({
          client,
          funnelName: client.current_funnel,
          blockId: input.blockId,
          createdBy: `${input.createdBy} => ${moduleName}`,
        });
      }


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


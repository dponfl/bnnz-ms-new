"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:switch-chat-blast-funnel-to-any-block-joi';


module.exports = {


  friendlyName: 'funnel:switch-chat-blast-funnel-to-any-block-joi',


  description: 'funnel:switch-chat-blast-funnel-to-any-block-joi',


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
      chatBlastName: Joi
        .string()
        .description('chatBlastName')
        .required(),
      chatBlastFunnel: Joi
        .string()
        .description('chatBlastFunnel')
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
          })),
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


    try {

      input = await schema.validateAsync(inputs.params);

      client = input.client;
      clientGuid = client.guid;
      accountGuid = client.account_use;

      currentAccount = _.find(client.accounts, {guid: client.account_use});

      const serviceChatBlastName = currentAccount.service.chat_blast_name;
      const chatBlastName = input.chatBlastName;
      const chatBlastFunnel = input.chatBlastFunnel;

      /**
       * Загрузить девственную версию Chat Blast воронки для перехода
       */

      const loadInitialChatBlastFunnelParams = {
        client,
        serviceChatBlastName,
        chatBlastName,
        chatBlastFunnel,
      };

      const loadInitialChatBlastFunnelRaw = await sails.helpers.general.loadInitialChatBlastFunnelJoi(loadInitialChatBlastFunnelParams);

      if (loadInitialChatBlastFunnelRaw.status !== 'ok') {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: 'Wrong loadInitialChatBlastFunnelJoi response',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.STORAGE_ERROR.name,
          payload: {
            loadInitialChatBlastFunnelParams,
          },
        });
      }

      const chatBlastFunnelName = `chatBlasts.${serviceChatBlastName}.${chatBlastName}.${chatBlastFunnel}`;

      if (loadInitialChatBlastFunnelRaw.payload.client.funnels[chatBlastFunnelName] == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: 'loadInitialChatBlastFunnelJoi response has no expected funnel',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            chatBlastFunnelName,
            funnels: loadInitialChatBlastFunnelRaw.payload.client.funnels,
          },
        });
      }


      /**
       * Установить в client, что выполняется воронка
       */


      currentAccount.keyboard = null;

      client.current_funnel = chatBlastFunnelName;

      if (input.skipBlocks != null) {

        /**
         * Update блоки, которые не нужно выполнять, используя переданные данные
         */

        _.forEach(input.skipBlocks, (skipBlockObj) => {
          const skipBlock = _.find(client.funnels[chatBlastFunnelName], {id: skipBlockObj.id});
          _.assign(skipBlock, skipBlockObj);
        });

      }

      /**
       * Активировать блок input.blockId
       */

      const activateBlock = _.find(client.funnels[chatBlastFunnelName], {id: input.blockId});

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
            funnel: client.funnels[chatBlastFunnelName],
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
          message: `${moduleName} not performed`,
          payload: {},
        });
      }

    }

  }

};


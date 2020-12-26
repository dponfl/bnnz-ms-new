"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'general:load-initial-chat-blast-funnel-joi';

module.exports = {


  friendlyName: 'general:load-initial-chat-blast-funnel-joi',


  description: 'general:load-initial-chat-blast-funnel-joi',


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
      serviceChatBlastName: Joi
        .string()
        .description('serviceChatBlastName')
        .required(),
      chatBlastName: Joi
        .string()
        .description('chatBlastName')
        .required(),
      chatBlastFunnel: Joi
        .string()
        .description('chatBlastFunnel')
        .required(),
    });

    let input;

    let clientGuid;
    let accountGuid;

    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      const serviceChatBlastName = input.serviceChatBlastName;
      const chatBlastName = input.chatBlastName;
      const chatBlastFunnel = input.chatBlastFunnel;

      const chatBlastFunnelName = `chatBlasts.${serviceChatBlastName}.${chatBlastName}.${chatBlastFunnel}`;

      const chatBlastsFunnelsGetByCriteriaParams = {
        criteria: {
          serviceChatBlastName,
          chatBlastName,
          chatBlastFunnel,
        }
      };

      const chatBlastsFunnelsGetByCriteriaRaw = await sails.helpers.storage.chatBlastsFunnelsGetByCriteriaJoi(chatBlastsFunnelsGetByCriteriaParams);

      if (chatBlastsFunnelsGetByCriteriaRaw.status == null || chatBlastsFunnelsGetByCriteriaRaw.status !== 'ok') {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: 'chatBlastsFunnelsGetByCriteriaJoi wrong response',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.CHAT_BLASTS_FUNNELS_ERROR.name,
          payload: {
            chatBlastsFunnelsGetByCriteriaParams,
            chatBlastsFunnelsGetByCriteriaRaw,
          },
        });
      }

      if (chatBlastsFunnelsGetByCriteriaRaw.payload.length === 0) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: 'Chat Blast funnel not found by criteria',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.CHAT_BLASTS_FUNNELS_ERROR.name,
          payload: {
            chatBlastsFunnelsGetByCriteriaParams,
            chatBlastsFunnelsGetByCriteriaRaw,
          },
        });
      }

      if (chatBlastsFunnelsGetByCriteriaRaw.payload.length === 1) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: 'More then one Chat Blast funnel found by criteria',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.CHAT_BLASTS_FUNNELS_ERROR.name,
          payload: {
            chatBlastsFunnelsGetByCriteriaParams,
            chatBlastsFunnelsGetByCriteriaRaw,
          },
        });
      }

      input.client.funnels[chatBlastFunnelName] = chatBlastsFunnelsGetByCriteriaRaw.payload;

      await sails.helpers.storage.clientUpdateJoi({
        criteria: {guid: clientGuid},
        data: {
          funnels: input.client.funnels,
        },
        createdBy: moduleName,
      });

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {
          client: input.client,
        }
      });


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
          status: 'error',
          message: `${moduleName} not performed`,
          payload: {},
        });
      }
    }

  }

};


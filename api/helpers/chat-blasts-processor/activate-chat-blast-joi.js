"use strict";

const Joi = require('@hapi/joi');
const uuid = require('uuid-apikey');
const moment = require('moment');

const moduleName = 'chat-blasts-processor:activate-chat-blast-joi';


module.exports = {


  friendlyName: 'chat-blasts-processor:activate-chat-blast-joi',


  description: 'chat-blasts-processor:activate-chat-blast-joi',


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
      chatBlastName: Joi
        .string()
        .description('Chat Blast name')
        .required(),
    });

    let input;

    let client;
    let clientGuid;
    let accountGuid;
    let currentAccount;
    let service;

    let actionTime;

    try {

      input = await schema.validateAsync(inputs.params);

      client = input.client;
      clientGuid = client.guid;
      accountGuid = client.account_use;
      currentAccount = _.find(client.accounts, {guid: accountGuid});
      service = currentAccount.service;

      const chatBlastFindCriteria = {
        name: service.chat_blast_name,
        active: true,
      };

      const chatBlastsRaw = await ChatBlasts.findOne(chatBlastFindCriteria)
        .tolerate(async (err) => {

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
            location: moduleName,
            message: sails.config.custom.CHAT_BLASTS_ERROR_CHAT_BLAST_FIND_ERROR.message,
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.CHAT_BLASTS_ERROR_CHAT_BLAST_FIND_ERROR.name,
            payload: {
              chatBlastFindCriteria,
              err,
            },
          });

        });

      const chatBlasts = chatBlastsRaw.cb_data || null;

      if (chatBlasts == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: sails.config.custom.CHAT_BLASTS_ERROR_CHAT_BLAST_NO_DATA.message,
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.CHAT_BLASTS_ERROR_CHAT_BLAST_NO_DATA.name,
          payload: {
            chatBlastsRaw,
            chatBlasts,
          },
        });
      }

      const chatBlast = _.get(chatBlasts, input.chatBlastName, null);

      if (chatBlast == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: sails.config.custom.CHAT_BLASTS_ERROR_NO_CHAT_BLAST.message,
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.CHAT_BLASTS_ERROR_NO_CHAT_BLAST.name,
          payload: {
            chatBlasts,
            chatBlastName: input.chatBlastName,
          },
        });
      }

      const actionElem = _.find(chatBlast.actionsList, {id: chatBlast.actionName});

      if (actionElem == null) {

        /**
         * Не можем найти элемент по указанному значению actionName
         */

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: sails.config.custom.CHAT_BLASTS_ERROR_NO_ELEMENT.message,
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.CHAT_BLASTS_ERROR_NO_ELEMENT.name,
          payload: {
            chatBlast,
          },
        });

      }

      switch (actionElem.timeType) {
        case sails.config.custom.enums.chatBlastsTimeTypes.ABSOLUTE:
          actionTime = moment(actionElem.showTime).format();
          break;

        case sails.config.custom.enums.chatBlastsTimeTypes.RELATIVE:
          actionTime = moment().add(actionElem.showTime).format();
          break;

        case sails.config.custom.enums.chatBlastsTimeTypes.NOW:
          actionTime = moment().format();
          break;

        default:

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
            location: moduleName,
            message: sails.config.custom.CHAT_BLASTS_ERROR_UNKNOWN_TIMETYPE.message,
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.CHAT_BLASTS_ERROR_UNKNOWN_TIMETYPE.name,
            payload: {
              actionElem,
            },
          });

      }

      const chatBlastPerformanceRec = _.assign(chatBlast, {
        guid: uuid.create().uuid,
        clientGuid,
        accountGuid,
        actionTime,
        done: false,
        callback: false,
        deleted: false,
      });

      /**
       *  Создаём запись в таблице "chat_blasts_performance"
       */

      await ChatBlastsPerformance.create(chatBlastPerformanceRec)
        .tolerate(async (err) => {

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
            location: moduleName,
            clientGuid,
            accountGuid,
            message: sails.config.custom.CHAT_BLASTS_ERROR_PERFORMANCE_REC_CREATE_ERROR.message,
            errorName: sails.config.custom.CHAT_BLASTS_ERROR_PERFORMANCE_REC_CREATE_ERROR.name,
            payload: {
              chatBlastPerformanceRec,
              err,
            },
          });

          return 'error';
        });


      await activateChatBlastFunnels(client, currentAccount, service.chat_blast_name, input.chatBlastName);

      return exits.success({
        status: 'success',
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
          status: 'error',
          message: `${moduleName} performed`,
          payload: {},
        });
      }

    }

  }

};

async function activateChatBlastFunnels(client, currentAccount, serviceChatBlastName, chatBlastName) {

  /**
   * Проверяем, должен ли использоваться переход в воронку для этого Chat Blast
   * Для этого ищем соответствующую воронку (или воронки)
   * в таблице ChatBlastsFunnels и если она/они есть, добавляем эту/эти воронку
   * в запись клиента (client) и обновляем запись клиента в БД
   */

  const methodName = 'activateChatBlastFunnels';

  const chatBlastsFunnelsGetByCriteriaParams = {
    criteria: {
      serviceChatBlastName,
      chatBlastName,
    }
  };

  const chatBlastsFunnelsGetByCriteriaRaw = await sails.helpers.storage.chatBlastsFunnelsGetByCriteriaJoi(chatBlastsFunnelsGetByCriteriaParams);

  if (chatBlastsFunnelsGetByCriteriaRaw.status == null || chatBlastsFunnelsGetByCriteriaRaw.status !== 'ok') {

    await LogProcessor.critical({
      message: 'chatBlastsFunnelsGetByCriteriaJoi wrong response',
      clientGuid: client.guid,
      accountGuid: currentAccount.guid,
      errorName: sails.config.custom.GENERAL_ERROR.name,
      emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
      location: `${moduleName}::${methodName}`,
      payload: {
        chatBlastsFunnelsGetByCriteriaRaw,
      },
    });

    return;
  }

  if (chatBlastsFunnelsGetByCriteriaRaw.payload.length === 0) {

    await LogProcessor.critical({
      message: 'Chat Blast Funnel not found by criteria',
      clientGuid: client.guid,
      accountGuid: currentAccount.guid,
      errorName: sails.config.custom.GENERAL_ERROR.name,
      emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
      location: `${moduleName}::${methodName}`,
      payload: {
        chatBlastsFunnelsGetByCriteriaRaw,
      },
    });

    return;
  }

  const chatBlastFunnelsRecs = chatBlastsFunnelsGetByCriteriaRaw.payload;

  const chatBlastFunnelsObj = {};

  for (const rec of chatBlastFunnelsRecs) {

    const chatBlastFunnelName = `chatBlasts.${serviceChatBlastName}.${chatBlastName}.${rec.chatBlastFunnel}`;

    chatBlastFunnelsObj[chatBlastFunnelName] = rec.funnel_data;

  }

  _.assign(client.funnels, chatBlastFunnelsObj);

  await sails.helpers.storage.clientUpdateJoi({
    criteria: {guid: client.guid},
    data: {
      funnels: client.funnels,
    },
    createdBy: `${moduleName}::${methodName}`,
  });

}


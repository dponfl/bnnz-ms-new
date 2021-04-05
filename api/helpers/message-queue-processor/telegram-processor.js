"use strict";

const _ = require('lodash');
const schedule = require('node-schedule');

const moduleName = 'message-queue-processor:telegram-processor';


module.exports = {


  friendlyName: 'message-queue-processor:telegram-processor',

  description: 'message-queue-processor:telegram-processor',

  inputs: {

  },

  exits: {

    success: {
      description: 'All done.',    },

  },


  fn: async function (inputs, exits) {

    let messages = {};
    let blockMsgInterval;
    let blockMsgSize;

    try {

      blockMsgInterval = sails.config.custom.config.messageOrchestrator.telegram.blockMsgInterval || 1000;

      blockMsgSize = sails.config.custom.config.messageOrchestrator.telegram.blockMsgSize || 25;

      const msgQueueGetParams = {
        criteria: {
          channel: sails.config.custom.enums.messenger.TELEGRAM,
          limit: blockMsgSize,
        }
      }

      const messagesRaw = await sails.helpers.storage.msgQueueGetJoi(msgQueueGetParams);

      if (
        _.isNil(messagesRaw.status)
        || messagesRaw.status !== 'success'
      ) {
        await LogProcessor.critical({
          message: 'Wrong status from msgQueueGetJoi',
          // clientGuid,
          // accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          payload: {
            msgQueueGetParams,
            messagesRaw,
          },
        });
      }

      if (
        _.isNil(messagesRaw.payload)
        || !_.isArray(messagesRaw.payload)
      ) {
        await LogProcessor.critical({
          message: 'Wrong payload from msgQueueGetJoi',
          // clientGuid,
          // accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          payload: {messagesRaw},
        });
      }

      /**
       * Формируем все сообщения в структуру, сгруппировонную по clientGuid
       */

      for (const msg of messagesRaw.payload) {

        if (_.isNil(messages[msg.clientGuid])) {
          messages[msg.clientGuid] = [];
        }

        messages[msg.clientGuid].push(msg);

      }

      /**
       * Обрабатываем сообщения последовательно по каждому клиенту
       * чтобы избежать коллизии, если при нескольких сообщениях в очереди
       * для одного клиента, какое-то сообщение не отправляется, то нельзя
       * пытаться отправлять ему следующее сообщение (иначе порядок/последовательность
       * сообщений будет нарушен
       */

        for (const clientGuid in messages) {

          await sendMsg(messages[clientGuid]);

        }

    } catch (e) {

      const throwError = false;
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
          message: `${moduleName} not performed`,
          payload: {},
        });
      }

    }

    /**
     * The below return needed for normal functioning of config/bootstrap.js
     */

    return exits.success({
      status: 'ok',
      message: 'Success',
      payload: {}
    });

  } // fn


};

async function sendMsg(clientMessages) {

  const methodName = 'sendMsg';

  let sendRes;
  let sendResRaw;

  for (const msg of clientMessages) {

    let success;

    switch (msg.msgType) {

      case 'deleteMessageJoi':

        sendResRaw = await sails.helpers.mgw.telegram.deleteMessageJoi(msg.payload);

        if (
          _.isNil(sendResRaw.status)
          || sendResRaw.status !== 'ok'
          || _.isNil(sendResRaw.payload)
        ) {

          await LogProcessor.critical({
            message: 'Wrong deleteMessageJoi reply',
            clientGuid: msg.clientGuid,
            accountGuid: msg.accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
            location: `${moduleName}:${methodName}`,
            payload: {
              msgGuid: msg.guid,
              sendResRaw,
            },
          });

          success = false;

        } else {

          success = sendResRaw.payload;

          const messageId = msg.payload.messageId || 0;

          await sails.helpers.storage.messageSaveJoi({
            message_id: messageId,
            message: msg.payload,
            message_format: sails.config.custom.enums.messageFormat.DEL,
            messenger: msg.channel,
            message_originator: sails.config.custom.enums.messageOriginator.BOT,
            client_id: msg.clientId,
            client_guid: msg.clientGuid,
          });

        }

        break;

      case 'docMessageJoi':

        sendResRaw = await sails.helpers.mgw.telegram.docMessageJoi(msg.payload);

        if (
          _.isNil(sendResRaw.status)
          || sendResRaw.status !== 'ok'
          || _.isNil(sendResRaw.payload)
        ) {

          await LogProcessor.critical({
            message: 'Wrong docMessageJoi reply',
            clientGuid: msg.clientGuid,
            accountGuid: msg.accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
            location: `${moduleName}:${methodName}`,
            payload: {
              msgGuid: msg.guid,
              sendResRaw,
            },
          });

          success = false;

        } else {

          const messageId = _.get(sendResRaw.payload, 'message_id', 0);

          success = messageId !== 0;

          await sails.helpers.storage.messageSaveJoi({
            message_id: messageId,
            message: msg.payload,
            message_format: sails.config.custom.enums.messageFormat.DOC,
            messenger: msg.channel,
            message_originator: sails.config.custom.enums.messageOriginator.BOT,
            client_id: msg.clientId,
            client_guid: msg.clientGuid,
          });

        }

        break;

      case 'editMessageReplyMarkupJoi':

        sendResRaw = await sails.helpers.mgw.telegram.editMessageReplyMarkupJoi(msg.payload);

        if (
          _.isNil(sendResRaw.status)
          || sendResRaw.status !== 'ok'
          || _.isNil(sendResRaw.payload)
        ) {

          await LogProcessor.critical({
            message: 'Wrong editMessageReplyMarkupJoi reply',
            clientGuid: msg.clientGuid,
            accountGuid: msg.accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
            location: `${moduleName}:${methodName}`,
            payload: {
              msgGuid: msg.guid,
              sendResRaw,
            },
          });

          success = false;

        } else {

          const messageId = _.get(sendResRaw.payload, 'message_id', 0);
          const chatId = _.get(sendResRaw.payload, 'chat.id', 0);

          if (
            messageId !== 0
            || chatId !== 0
            || sendResRaw.payload === true
          ) {

            success = true;

            await sails.helpers.storage.messageSaveJoi({
              message_id: messageId,
              message: msg.payload,
              message_format: sails.config.custom.enums.messageFormat.EDIT_RM,
              messenger: msg.channel,
              message_originator: sails.config.custom.enums.messageOriginator.BOT,
              client_id: msg.clientId,
              client_guid: msg.clientGuid,
            });

          } else {

            success = false;

          }

        }

        break;

      case '':
        break;

      default:

        success = false;

        await LogProcessor.critical({
          message: 'Unknown msgType',
          clientGuid: msg.clientGuid,
          accountGuid: msg.accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: `${moduleName}:${methodName}`,
          payload: {msg},
        });

    }

    if (success) {

      /**
       * Отправка сообщения прошла успешно и необходимо выставить флаг "done"
       * для соответствующей записи в MsgQueue
       */

      const msgQueueUpdateParams = {
        criteria: {
          guid: msg.guid,
        },
        data: {
          done: true,
        }
      }

      const msgQueueUpdateRaw = await sails.helpers.storage.msgQueueUpdateJoi(msgQueueUpdateParams);

      if (
        _.isNil(msgQueueUpdateRaw.status)
        || msgQueueUpdateRaw.status !== 'success'
      ) {
        await LogProcessor.critical({
          message: 'Wrong status from msgQueueUpdateJoi',
          // clientGuid,
          // accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          payload: {
            msgQueueUpdateParams,
            msgQueueUpdateRaw,
          },
        });
      }

    } else {

      /**
       * Сообщение не было отправлено (Telegram выдал ошибку)
       * и поэтому следующие сообщения этому клиенту отправлять нельзя
       */

      break;

    }

  }

}



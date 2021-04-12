"use strict";

const moment = require('moment');
const sleep = require('util').promisify(setTimeout);

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

    // TODO: Помесить этот код внутрь setTimeout

    setTimeout(async () => {

      let messages = {};
      let blockMsgInterval;
      let blockMsgSize;

      try {

        await LogProcessor.info({
          message: `Started ${moduleName}`,
        });

        blockMsgInterval = sails.config.custom.config.messageOrchestrator.telegram.blockMsgInterval || 1000;

        blockMsgSize = sails.config.custom.config.messageOrchestrator.telegram.blockMsgSize || 25;

        const msgQueueGetParams = {
          criteria: {
            channel: sails.config.custom.enums.messenger.TELEGRAM,
            done: false,
            deleted: false,
          },
          limit: blockMsgSize,
        }

        while (true) {

          // TODO: delete logs ofter QA
          // await LogProcessor.info({
          //   message: `Next MsgQueue records loop on ${moment().format()}`,
          // });


          const momentStart = moment();

          messages = {};

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

          // TODO: delete logs ofter QA
          if (messagesRaw.payload.length > 0) {
            await LogProcessor.info({
              message: `Found ${messagesRaw.payload.length} messages in message queue`,
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

          const currentMoment = moment();

          const usedTime = moment.duration(currentMoment.diff(momentStart)).asMilliseconds();

          const leftTime = blockMsgInterval - usedTime;

          // TODO: delete logs ofter QA
          // await LogProcessor.info({
          //   message: `leftTime: ${leftTime}`,
          // });

          if (leftTime > 0) {
            sleep(leftTime);
          }

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

    }, 3000);

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

  let sendResRaw;

  let msgSaveParams;
  let msgSaveRec;
  let messageGuid;


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

          // success = false;
          success = true;

        } else {

          // success = sendResRaw.payload;
          success = true;

          const messageId = _.toString(msg.payload.messageId);

          msgSaveParams = {
            msgSaveParams: {
              action: sails.config.custom.enums.messageSaveActions.CREATE,
              clientGuid: msg.clientGuid,
              accountGuid: msg.accountGuid,
              clientId: msg.clientId,
              messageId,
              message: msg.payload,
              messageFormat: sails.config.custom.enums.messageFormat.DEL,
              channel: msg.channel,
              messageOriginator: sails.config.custom.enums.messageOriginator.BOT,
            },
            createdBy: `${moduleName} => ${methodName}`,
          };

          msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

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

          const messageId = _.toString(_.get(sendResRaw.payload, 'message_id', 0));
          const chatId = _.get(sendResRaw.payload, 'chat.id', 0);

          if (
            messageId !== '0'
            || chatId !== 0
            || sendResRaw.payload === true
          ) {

            success = true;

            msgSaveParams = {
              msgSaveParams: {
                action: sails.config.custom.enums.messageSaveActions.CREATE,
                clientGuid: msg.clientGuid,
                accountGuid: msg.accountGuid,
                clientId: msg.clientId,
                messageId,
                message: msg.payload,
                messageFormat: sails.config.custom.enums.messageFormat.EDIT_RM,
                channel: msg.channel,
                messageOriginator: sails.config.custom.enums.messageOriginator.BOT,
              },
              createdBy: `${moduleName} => ${methodName}`,
            };

            msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

          } else {

            success = false;

          }

        }

        break;

      case 'editMessageTextJoi':

        sendResRaw = await sails.helpers.mgw.telegram.editMessageTextJoi(msg.payload);

        if (
          _.isNil(sendResRaw.status)
          || sendResRaw.status !== 'ok'
          || _.isNil(sendResRaw.payload)
        ) {

          await LogProcessor.critical({
            message: 'Wrong editMessageTextJoi reply',
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

          const messageId = _.toString(_.get(sendResRaw.payload, 'message_id', 0));
          const chatId = _.get(sendResRaw.payload, 'chat.id', 0);

          if (
            messageId !== '0'
            || chatId !== 0
            || sendResRaw.payload === true
          ) {

            success = true;

            msgSaveParams = {
              msgSaveParams: {
                action: sails.config.custom.enums.messageSaveActions.CREATE,
                clientGuid: msg.clientGuid,
                accountGuid: msg.accountGuid,
                clientId: msg.clientId,
                messageId,
                message: msg.payload,
                messageFormat: sails.config.custom.enums.messageFormat.EDIT_T,
                channel: msg.channel,
                messageOriginator: sails.config.custom.enums.messageOriginator.BOT,
              },
              createdBy: `${moduleName} => ${methodName}`,
            };

            msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

          } else {

            success = false;

          }

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

          const messageId = _.toString(_.get(sendResRaw.payload, 'message_id', 0));

          success = messageId !== '0';

          messageGuid = msg.messageGuid;

          msgSaveParams = {
            msgSaveParams: {
              action: sails.config.custom.enums.messageSaveActions.UPDATE,
              messageGuid,
              clientGuid: msg.clientGuid,
              accountGuid: msg.accountGuid,
              messageId,
              message: msg.payload,
              messageFormat: sails.config.custom.enums.messageFormat.DOC,
              channel: msg.channel,
              messageOriginator: sails.config.custom.enums.messageOriginator.BOT,
            },
            createdBy: `${moduleName} => ${methodName}`,
          };

          msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

        }

        break;

      case 'forcedMessageJoi':

        sendResRaw = await sails.helpers.mgw.telegram.forcedMessageJoi(msg.payload);

        if (
          _.isNil(sendResRaw.status)
          || sendResRaw.status !== 'ok'
          || _.isNil(sendResRaw.payload)
        ) {

          await LogProcessor.critical({
            message: 'Wrong forcedMessageJoi reply',
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

          const messageId = _.toString(_.get(sendResRaw.payload, 'message_id', 0));
          const chatId = _.get(sendResRaw.payload, 'chat.id', 0);

          if (
            messageId !== '0'
            && chatId !== 0
          ) {

            success = true;

            /**
             * Выставить флаг "forced_reply_expected"
             * который означает, что клиенту было отправлено ForcedMessage
             * и мы ожидаем получить ответ в виде ответа на ForcedMessage
             * а не простым сообщением
             */

            const clientUpdateParams = {
              criteria: {
                id: msg.clientId,
              },
              data: {
                forced_reply_expected: true,
              },
              createdBy: `${moduleName} => ${methodName}`,
              makeClientFieldsRecord: false,
            };

            const updateClientRecRaw = await sails.helpers.storage.clientUpdateJoi(clientUpdateParams);

            if (
              _.isNil(updateClientRecRaw.status)
              || updateClientRecRaw.status !== 'ok'
            ) {
              await LogProcessor.critical({
                message: 'Wrong status from clientUpdateJoi',
                clientGuid: msg.clientGuid,
                accountGuid: msg.accountGuid,
                // requestId: null,
                // childRequestId: null,
                errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
                location: moduleName,
                payload: {
                  clientUpdateParams,
                  updateClientRecRaw,
                },
              });
            }

            messageGuid = msg.messageGuid;

            msgSaveParams = {
              msgSaveParams: {
                action: sails.config.custom.enums.messageSaveActions.UPDATE,
                messageGuid,
                clientGuid: msg.clientGuid,
                accountGuid: msg.accountGuid,
                messageId,
                message: msg.payload,
                messageFormat: sails.config.custom.enums.messageFormat.FORCED,
                channel: msg.channel,
                messageOriginator: sails.config.custom.enums.messageOriginator.BOT,
              },
              createdBy: `${moduleName} => ${methodName}`,
            };

            msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

          } else {

            success = false;

          }

        }

        break;

      case 'imgMessageJoi':

        sendResRaw = await sails.helpers.mgw.telegram.imgMessageJoi(msg.payload);

        if (
          _.isNil(sendResRaw.status)
          || sendResRaw.status !== 'ok'
          || _.isNil(sendResRaw.payload)
        ) {

          await LogProcessor.critical({
            message: 'Wrong imgMessageJoi reply',
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

          const messageId = _.toString(_.get(sendResRaw.payload, 'message_id', 0));
          const chatId = _.get(sendResRaw.payload, 'chat.id', 0);

          if (
            messageId !== '0'
            && chatId !== 0
          ) {

            success = true;

            messageGuid = msg.messageGuid;

            msgSaveParams = {
              msgSaveParams: {
                action: sails.config.custom.enums.messageSaveActions.UPDATE,
                messageGuid,
                clientGuid: msg.clientGuid,
                accountGuid: msg.accountGuid,
                messageId,
                message: msg.payload,
                messageFormat: sails.config.custom.enums.messageFormat.IMG,
                channel: msg.channel,
                messageOriginator: sails.config.custom.enums.messageOriginator.BOT,
              },
              createdBy: `${moduleName} => ${methodName}`,
            };

            msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

          } else {

            success = false;

          }

        }

        break;

      case 'inlineKeyboardMessageJoi':

        sendResRaw = await sails.helpers.mgw.telegram.inlineKeyboardMessageJoi(msg.payload);

        if (
          _.isNil(sendResRaw.status)
          || sendResRaw.status !== 'ok'
          || _.isNil(sendResRaw.payload)
        ) {

          await LogProcessor.critical({
            message: 'Wrong inlineKeyboardMessageJoi reply',
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

          const messageId = _.toString(_.get(sendResRaw.payload, 'message_id', 0));
          const chatId = _.get(sendResRaw.payload, 'chat.id', 0);

          if (
            messageId !== '0'
            && chatId !== 0
          ) {

            success = true;

            messageGuid = msg.messageGuid;

            msgSaveParams = {
              msgSaveParams: {
                action: sails.config.custom.enums.messageSaveActions.UPDATE,
                messageGuid,
                clientGuid: msg.clientGuid,
                accountGuid: msg.accountGuid,
                messageId,
                message: msg.payload,
                messageFormat: sails.config.custom.enums.messageFormat.INLINEKEYBOARD,
                channel: msg.channel,
                messageOriginator: sails.config.custom.enums.messageOriginator.BOT,
              },
              createdBy: `${moduleName} => ${methodName}`,
            };

            msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

          } else {

            success = false;

          }

        }

        break;

      case 'keyboardMessageJoi':

        sendResRaw = await sails.helpers.mgw.telegram.keyboardMessageJoi(msg.payload);

        if (
          _.isNil(sendResRaw.status)
          || sendResRaw.status !== 'ok'
          || _.isNil(sendResRaw.payload)
        ) {

          await LogProcessor.critical({
            message: 'Wrong keyboardMessageJoi reply',
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

          const messageId = _.toString(_.get(sendResRaw.payload, 'message_id', 0));
          const chatId = _.get(sendResRaw.payload, 'chat.id', 0);

          if (
            messageId !== '0'
            && chatId !== 0
          ) {

            success = true;

            messageGuid = msg.messageGuid;

            msgSaveParams = {
              msgSaveParams: {
                action: sails.config.custom.enums.messageSaveActions.UPDATE,
                messageGuid,
                clientGuid: msg.clientGuid,
                accountGuid: msg.accountGuid,
                messageId,
                message: msg.payload,
                messageFormat: sails.config.custom.enums.messageFormat.KEYBOARD,
                channel: msg.channel,
                messageOriginator: sails.config.custom.enums.messageOriginator.BOT,
              },
              createdBy: `${moduleName} => ${methodName}`,
            };

            msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

          } else {

            success = false;

          }

        }

        break;

      case 'keyboardRemoveJoi':

        sendResRaw = await sails.helpers.mgw.telegram.keyboardRemoveJoi(msg.payload);

        if (
          _.isNil(sendResRaw.status)
          || sendResRaw.status !== 'ok'
          || _.isNil(sendResRaw.payload)
        ) {

          await LogProcessor.critical({
            message: 'Wrong keyboardRemoveJoi reply',
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

          const messageId = _.toString(_.get(sendResRaw.payload, 'message_id', 0));
          const chatId = _.get(sendResRaw.payload, 'chat.id', 0);

          if (
            messageId !== '0'
            && chatId !== 0
          ) {

            success = true;

            messageGuid = msg.messageGuid;

            msgSaveParams = {
              msgSaveParams: {
                action: sails.config.custom.enums.messageSaveActions.UPDATE,
                messageGuid,
                clientGuid: msg.clientGuid,
                accountGuid: msg.accountGuid,
                messageId,
                message: msg.payload,
                messageFormat: sails.config.custom.enums.messageFormat.KEYBOARD_REMOVE,
                channel: msg.channel,
                messageOriginator: sails.config.custom.enums.messageOriginator.BOT,
              },
              createdBy: `${moduleName} => ${methodName}`,
            };

            msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

          } else {

            success = false;

          }

        }

        break;

      case 'sendInvoiceJoi':

        sendResRaw = await sails.helpers.mgw.telegram.sendInvoiceJoi(msg.payload);

        if (
          _.isNil(sendResRaw.status)
          || sendResRaw.status !== 'ok'
          || _.isNil(sendResRaw.payload)
        ) {

          await LogProcessor.critical({
            message: 'Wrong sendInvoiceJoi reply',
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

          const messageId = _.toString(_.get(sendResRaw.payload, 'message_id', 0));
          const chatId = _.get(sendResRaw.payload, 'chat.id', 0);

          if (
            messageId !== '0'
            && chatId !== 0
          ) {

            success = true;

            messageGuid = msg.messageGuid;

            msgSaveParams = {
              msgSaveParams: {
                action: sails.config.custom.enums.messageSaveActions.UPDATE,
                messageGuid,
                clientGuid: msg.clientGuid,
                accountGuid: msg.accountGuid,
                messageId,
                message: msg.payload,
                messageFormat: sails.config.custom.enums.messageFormat.SEND_INVOICE,
                channel: msg.channel,
                messageOriginator: sails.config.custom.enums.messageOriginator.BOT,
              },
              createdBy: `${moduleName} => ${methodName}`,
            };

            msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

          } else {

            success = false;

          }

        }

        break;

      case 'simpleMessageJoi':

        sendResRaw = await sails.helpers.mgw.telegram.simpleMessageJoi(msg.payload);

        if (
          _.isNil(sendResRaw.status)
          || sendResRaw.status !== 'ok'
          || _.isNil(sendResRaw.payload)
        ) {

          await LogProcessor.critical({
            message: 'Wrong simpleMessageJoi reply',
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

          const messageId = _.toString(_.get(sendResRaw.payload, 'message_id', 0));
          const chatId = _.get(sendResRaw.payload, 'chat.id', 0);

          if (
            messageId !== '0'
            && chatId !== 0
          ) {

            success = true;

            messageGuid = msg.messageGuid;

            msgSaveParams = {
              msgSaveParams: {
                action: sails.config.custom.enums.messageSaveActions.UPDATE,
                messageGuid,
                clientGuid: msg.clientGuid,
                accountGuid: msg.accountGuid,
                messageId,
                message: msg.payload,
                messageFormat: sails.config.custom.enums.messageFormat.SIMPLE,
                channel: msg.channel,
                messageOriginator: sails.config.custom.enums.messageOriginator.BOT,
              },
              createdBy: `${moduleName} => ${methodName}`,
            };

            msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

          } else {

            success = false;

          }

        }

        break;

      case 'stickerMessageJoi':

        sendResRaw = await sails.helpers.mgw.telegram.stickerMessageJoi(msg.payload);

        if (
          _.isNil(sendResRaw.status)
          || sendResRaw.status !== 'ok'
          || _.isNil(sendResRaw.payload)
        ) {

          await LogProcessor.critical({
            message: 'Wrong stickerMessageJoi reply',
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

          const messageId = _.toString(_.get(sendResRaw.payload, 'message_id', 0));
          const chatId = _.get(sendResRaw.payload, 'chat.id', 0);

          if (
            messageId !== '0'
            && chatId !== 0
          ) {

            success = true;

            messageGuid = msg.messageGuid;

            msgSaveParams = {
              msgSaveParams: {
                action: sails.config.custom.enums.messageSaveActions.UPDATE,
                messageGuid,
                clientGuid: msg.clientGuid,
                accountGuid: msg.accountGuid,
                messageId,
                message: msg.payload,
                messageFormat: sails.config.custom.enums.messageFormat.STICKER,
                channel: msg.channel,
                messageOriginator: sails.config.custom.enums.messageOriginator.BOT,
              },
              createdBy: `${moduleName} => ${methodName}`,
            };

            msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

          } else {

            success = false;

          }

        }

        break;

      case 'videoMessageJoi':

        sendResRaw = await sails.helpers.mgw.telegram.videoMessageJoi(msg.payload);

        if (
          _.isNil(sendResRaw.status)
          || sendResRaw.status !== 'ok'
          || _.isNil(sendResRaw.payload)
        ) {

          await LogProcessor.critical({
            message: 'Wrong videoMessageJoi reply',
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

          const messageId = _.toString(_.get(sendResRaw.payload, 'message_id', 0));
          const chatId = _.get(sendResRaw.payload, 'chat.id', 0);

          if (
            messageId !== '0'
            && chatId !== 0
          ) {

            success = true;

            messageGuid = msg.messageGuid;

            msgSaveParams = {
              msgSaveParams: {
                action: sails.config.custom.enums.messageSaveActions.UPDATE,
                messageGuid,
                clientGuid: msg.clientGuid,
                accountGuid: msg.accountGuid,
                messageId,
                message: msg.payload,
                messageFormat: sails.config.custom.enums.messageFormat.VIDEO,
                channel: msg.channel,
                messageOriginator: sails.config.custom.enums.messageOriginator.BOT,
              },
              createdBy: `${moduleName} => ${methodName}`,
            };

            msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

          } else {

            success = false;

          }

        }

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
          location: `${moduleName} => ${methodName}`,
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
          location: `${moduleName} => ${methodName}`,
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



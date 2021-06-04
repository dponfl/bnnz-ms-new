"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'api:helpers:message-processor:delete-inline-keyboard-buttons';


module.exports = {


  friendlyName: 'api:helpers:message-processor:delete-inline-keyboard-buttons',


  description: 'api:helpers:message-processor:delete-inline-keyboard-buttons',


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
        .object()
        .description('Client record')
        .required(),
      account: Joi
        .object()
        .description('Account record')
        .required(),
      messageGuid: Joi
        .string()
        .description('message guid')
        .guid()
        .required(),
    });

    let input;

    let client;
    let account;
    let clientGuid;
    let accountGuid;


    try {

      input = await schema.validateAsync(inputs.params);

      client = input.client;
      account = input.account;
      clientGuid = client.guid;
      accountGuid = account.guid;

      const messageGuid = input.messageGuid;

      /**
       * Достаём данные message_id
       */

      const msgGetParams = {
        criteria: {
          messageGuid,
        }
      };

      const msgRecRaw = await sails.helpers.storage.messageGetJoi(msgGetParams);

      if (
        _.isNil(msgRecRaw.status)
        || msgRecRaw.status !== 'success'
        || _.isNil(msgRecRaw.payload)
      ) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
          location: moduleName,
          message: 'Wrong messageGetJoi response',
          errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
          payload: {
            msgGetParams,
            msgRecRaw,
          },
        });
      }

      const messageRecs = msgRecRaw.payload;

      const messageId = messageRecs[0].messageId;

      /**
       * удаление кнопок из соответствующего inline_keyboard сообщения
       */

      /**
       * Достаём данные PushMessage
       */

      const pushMessageName = account.service.push_message_name;

      const pushMessageGetParams = {
        pushMessageName,
      };

      const pushMessageGetRaw = await sails.helpers.storage.pushMessageGetJoi(pushMessageGetParams);

      if (pushMessageGetRaw.status !== 'ok') {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Wrong pushMessageGetJoi response',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.STORAGE_ERROR.name,
          payload: {
            pushMessageGetParams,
            pushMessageGetRaw,
          },
        });

      }

      const pushMessage = pushMessageGetRaw.payload;

      let messageDataPath = 'general.inlineKeyboardButtonPressed.deleteInlineKeyboard';
      let messageData = _.get(pushMessage, messageDataPath, null);

      if (messageData == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'No expected messageData',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.STORAGE_ERROR.name,
          payload: {
            pushMessage,
            messageDataPath,
            messageData,
          },
        });
      }

      const sendMessageUpdateRes = await sails.helpers.messageProcessor.sendMessageJoi({
        client,
        messageData,
        additionalParams: {
          chat_id: client.chat_id,
          message_id: messageId,
          disable_web_page_preview: true,
        },
        skipMsgQueue: true,
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
          clientGuid,
          accountGuid,
          error: e,
          location: moduleName,
          throwError,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          clientGuid,
          accountGuid,
          error: e,
          location: moduleName,
          throwError,
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


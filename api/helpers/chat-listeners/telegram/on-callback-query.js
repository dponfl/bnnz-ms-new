"use strict";

const _ = require('lodash');

const moduleName = 'chat-listeners:telegram:on-callback-query';

module.exports = {


  friendlyName: 'On callback query',


  description: 'Manage Telegram bot callback queries',


  inputs: {

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

    let client;
    let clientGuid;
    let accountGuid;
    let currentAccount;
    let pushMessage;

    // sails.log.info('******************** telegramListener.onCallbackQuery ********************');

    sails.config.custom.telegramBot.on('callback_query', async (query) => {

      try {

        // sails.log.info('Got callback query: ', query);

        await sails.config.custom.telegramBot.answerCallbackQuery(query.id);

        /**
         * Get the client record from DB
         */

        let getClientResponse = await sails.helpers.storage.clientGet.with({
          messenger: sails.config.custom.enums.messenger.TELEGRAM,
          msg: query,
        });

        if (getClientResponse.status == null
          || getClientResponse.status !== 'found'
          || getClientResponse.payload == null
        ) {
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Wrong clientGet response',
            errorName: sails.config.custom.STORAGE_ERROR.name,
            payload: {
              messenger: sails.config.custom.enums.messenger.TELEGRAM,
              msg: query,
            },
          });
        }

        client = getClientResponse.payload;
        clientGuid = client.guid;
        accountGuid = client.account_use;

        currentAccount = _.find(client.accounts, {guid: accountGuid});

        /**
         * удаление кнопок из соответствующего inline_keyboard сообщения
         */

        /**
         * Достаём данные PushMessage
         */

        const pushMessageName = currentAccount.service.push_message_name;

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

        pushMessage = pushMessageGetRaw.payload;

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
            message_id: query.message.message_id,
            disable_web_page_preview: true,
          },
        });

        /**
         * отправка PushMessage с текстом нажатой кнопки
         */

        /**
         * Не отправляем текст нажатой кнопки в случае проверки выполнения заданий
         */

        if (!/^push_msg_tsk_l_/i.test(query.data)
        && !/^push_msg_tsk_lc_/i.test(query.data)) {

          messageDataPath = 'general.inlineKeyboardButtonPressed.textMessageToSend';
          messageData = _.get(pushMessage, messageDataPath, null);

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

          messageData.message.html[0].text = `${messageData.message.html[0].text}${_.random(1, 6)}`;

          const replyMarkupData = _.flattenDeep(query.message.reply_markup.inline_keyboard);

          const keyObj = _.find(replyMarkupData, {callback_data: query.data});

          if (keyObj == null) {
            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.ERROR,
              location: moduleName,
              message: 'No expected data at callback query',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.GENERAL_ERROR.name,
              payload: {
                queryInlineKeyboard: query.message.reply_markup.inline_keyboard,
                replyMarkupData,
                queryData: query.data,
              },
            });
          }

          const sendMessageRes = await sails.helpers.messageProcessor.sendMessageJoi({
            client,
            messageData,
            additionalTokens: [
              {
                token: '$KeyText$',
                value: keyObj.text,
              },
            ],
          });

        }


        /**
         * Call the respective Supervisor helper
         */

        /**
         * По данным callback_query проверяем к какой категории он относиться
         */

        if (/^push_msg_/i.test(query.data)) {

          /**
           * Полученный callback_query относиться к push messages
           */

          await sails.helpers.pushMessages.supervisorCallbackJoi({
            client: getClientResponse.payload,
            query,
          });

        } else {

          await sails.helpers.funnel.supervisorCallbackJoi({
            client: getClientResponse.payload,
            query,
          });

        }

      } catch (e) {
        const throwError = true;
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
            message: `${moduleName} performed`,
            payload: {},
          });
        }
      }

    });

    /**
     * The below return needed for normal functioning of config/bootstrap.js
     */

    return exits.success({
      status: 'ok',
      message: 'success',
      payload: {}
    });

  }


};


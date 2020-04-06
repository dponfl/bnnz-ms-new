"use strict";

const {expect} = require('chai');
const mlog = require('mocha-logger');
const casual = require('casual');

describe('Test sending and updating Telegram message', function () {

  let customConfig;

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;
  });

  it('should perform task message and its transformation to done message with delay between them', async function () {

    return new Promise(async (resolve) => {

      this.timeout(100000);

      const client = await Client.findOne({
        guid: 'f079a758-a530-4c19-83fb-fca217c07639'
      });

      client.accounts = await Account.find({client: client.id});

      const messageData = customConfig.pushMessages.tasks.likes.messages[0];

      messageData.message.inline_keyboard = _.concat(messageData.message.inline_keyboard,
        [
          [
            {
              "text": "MSG_TASK_PERFORM_BTN",
              "callback_data": "push_msg_tsk_l_" + casual.uuid
            }
          ]
        ]
      );

      const editMessageData = customConfig.pushMessages.tasks.likes_done.messages[0];

      let msgRes, editMsgRes;

      msgRes = await sails.helpers.messageProcessor.sendMessageJoi({
        client,
        messageData,
        additionalTokens: [
          {
            token: '$PostLink$',
            value: `https://www.instagram.com/p/B7QmKU8FORo`,
          },
        ],
      });

      setTimeout(async function () {

        editMsgRes = await sails.helpers.messageProcessor.sendMessageJoi({
          client,
          messageData: editMessageData,
          additionalTokens: [
            {
              token: '$PostLink$',
              value: `https://www.instagram.com/p/B7QmKU8FORo`,
            },
          ],
          additionalParams: {
            chat_id: client.chat_id,
            message_id: `${msgRes.payload.message_id}`,
          },
        });

        resolve();

      }, 5000);

    });

  });

  it.only('should perform task message and its transformation to not done message with delay between them', async function () {

    return new Promise(async (resolve) => {

      this.timeout(100000);

      const client = await Client.findOne({
        guid: 'f079a758-a530-4c19-83fb-fca217c07639'
      });

      client.accounts = await Account.find({client: client.id});

      const messageData = customConfig.pushMessages.tasks.likes.messages[0];

      messageData.message.inline_keyboard = _.concat(messageData.message.inline_keyboard,
        [
          [
            {
              "text": "MSG_TASK_PERFORM_BTN",
              "callback_data": "push_msg_tsk_l_" + casual.uuid
            }
          ]
        ]
      );


      const editMessageData = customConfig.pushMessages.tasks.likes_not_done.messages[0];

      editMessageData.message.inline_keyboard = _.concat(editMessageData.message.inline_keyboard,
        [
          [
            {
              "text": "MSG_TASK_PERFORM_BTN",
              "callback_data": "push_msg_tsk_l_" + casual.uuid
            }
          ]
        ]
      );

      let msgRes, editMsgRes;

      msgRes = await sails.helpers.messageProcessor.sendMessageJoi({
        client,
        messageData,
        additionalTokens: [
          {
            token: '$PostLink$',
            value: `https://www.instagram.com/p/B7QmKU8FORo`,
          },
        ],
      });

      setTimeout(async function () {

        editMsgRes = await sails.helpers.messageProcessor.sendMessageJoi({
          client,
          messageData: editMessageData,
          additionalTokens: [
            {
              token: '$PostLink$',
              value: `https://www.instagram.com/p/B7QmKU8FORo`,
            },
          ],
          additionalParams: {
            chat_id: client.chat_id,
            message_id: `${msgRes.payload.message_id}`,
          },
        });

        resolve();

      }, 5000);

    });

  });

});

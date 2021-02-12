"use strict";

const {expect} = require('chai');
const mlog = require('mocha-logger');
const casual = require('casual');

describe('Test sending and updating Telegram message', function () {

  let pushMessageName;
  let pushMessageGetParams;
  let pushMessageGetRaw;
  let pushMessage;

  let client;
  let currentAccount;

  const timeout = 10000;

  before(async function () {

    const getClientRes = await sails.helpers.storage.clientGetByCriteriaJoi({
      criteria: {
        guid: 'ddb6d16d-d91f-4a34-9653-2e000425b0d5'
      }
    });

    client = getClientRes.payload[0];

    currentAccount = _.find(client.accounts, {guid: client.account_use});

    /**
     * Достаём данные PushMessage
     */

    pushMessageName = currentAccount.service.push_message_name;

    pushMessageGetParams = {
      pushMessageName,
    };

    pushMessageGetRaw = await sails.helpers.storage.pushMessageGetJoi(pushMessageGetParams);

    pushMessage = pushMessageGetRaw.payload;

  });

  it('should perform task message (like) and its transformation to done message with delay between them', async function () {

    return new Promise(async (resolve) => {

      this.timeout(100000);

      const messageDataPath = 'tasks.likes';
      const messageData = _.get(pushMessage, messageDataPath, null);

      messageData.message.inline_keyboard[1] = [
        {
          "text": "COMMON_MSG_TASK_PERFORM_BTN",
          "callback_data": "push_msg_tsk_l_" + casual.uuid
        }
      ];


      const editMessageDataPath = 'tasks.likes_done';
      const editMessageData = _.get(pushMessage, editMessageDataPath, null);

      let msgRes, editMsgRes;

      msgRes = await sails.helpers.messageProcessor.sendMessageJoi({
        client,
        messageData,
        additionalTokens: [
          {
            token: '$PostLink$',
            value: `https://www.instagram.com/p/B7QmKU8FORo`,
          },
          {
            token: '$CurrentAccount$',
            value: currentAccount.inst_profile,
          },
        ],
        blockModifyHelperParams: {
          taskGuid: casual.uuid,
        },
        disableWebPagePreview: true,
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

      }, timeout);

    });

  });

  it('should perform task message (like) and its transformation to not done message with delay between them', async function () {

    return new Promise(async (resolve) => {

      this.timeout(100000);

      const messageDataPath = 'tasks.likes';
      const messageData = _.get(pushMessage, messageDataPath, null);

      messageData.message.inline_keyboard[1] = [
        {
          "text": "COMMON_MSG_TASK_PERFORM_BTN",
          "callback_data": "push_msg_tsk_l_" + casual.uuid
        }
      ];

      const editMessageDataPath = 'tasks.likes_not_done';
      const editMessageData = _.get(pushMessage, editMessageDataPath, null);

      editMessageData.message.inline_keyboard[1] = [
        {
          "text": "COMMON_MSG_TASK_PERFORM_BTN",
          "callback_data": "push_msg_tsk_l_" + casual.uuid
        }
      ];

      let msgRes, editMsgRes;

      msgRes = await sails.helpers.messageProcessor.sendMessageJoi({
        client,
        messageData,
        additionalTokens: [
          {
            token: '$PostLink$',
            value: `https://www.instagram.com/p/B7QmKU8FORo`,
          },
          {
            token: '$CurrentAccount$',
            value: currentAccount.inst_profile,
          },
        ],
        blockModifyHelperParams: {
          taskGuid: casual.uuid,
        },
        disableWebPagePreview: true,
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

      }, timeout);

    });

  });

  it('should perform task message (like + comment) and its transformation to done message with delay between them', async function () {

    return new Promise(async (resolve) => {

      this.timeout(100000);

      const messageDataPath = 'tasks.likes_comments';
      const messageData = _.get(pushMessage, messageDataPath, null);

      messageData.message.inline_keyboard[1] = [
        {
          "text": "COMMON_MSG_TASK_PERFORM_BTN",
          "callback_data": "push_msg_tsk_l_" + casual.uuid
        }
      ];

      const editMessageDataPath = 'tasks.likes_comments_done';
      const editMessageData = _.get(pushMessage, editMessageDataPath, null);

      let msgRes, editMsgRes;

      msgRes = await sails.helpers.messageProcessor.sendMessageJoi({
        client,
        messageData,
        additionalTokens: [
          {
            token: '$PostLink$',
            value: `https://www.instagram.com/p/B7QmKU8FORo`,
          },
          {
            token: '$CurrentAccount$',
            value: currentAccount.inst_profile,
          },
        ],
        blockModifyHelperParams: {
          taskGuid: casual.uuid,
        },
        disableWebPagePreview: true,
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

      }, timeout);

    });

  });

  it('should perform task message (like + comment) and its transformation to not done (no like & no comment) message with delay between them', async function () {

    return new Promise(async (resolve) => {

      this.timeout(100000);

      const messageDataPath = 'tasks.likes_comments';
      const messageData = _.get(pushMessage, messageDataPath, null);

      messageData.message.inline_keyboard[1] = [
        {
          "text": "COMMON_MSG_TASK_PERFORM_BTN",
          "callback_data": "push_msg_tsk_l_" + casual.uuid
        }
      ];

      const editMessageDataPath = 'tasks.likes_comments_not_done';
      const editMessageData = _.get(pushMessage, editMessageDataPath, null);

      editMessageData.message.inline_keyboard[1] = [
        {
          "text": "COMMON_MSG_TASK_PERFORM_BTN",
          "callback_data": "push_msg_tsk_l_" + casual.uuid
        }
      ];

      let msgRes, editMsgRes;

      msgRes = await sails.helpers.messageProcessor.sendMessageJoi({
        client,
        messageData,
        additionalTokens: [
          {
            token: '$PostLink$',
            value: `https://www.instagram.com/p/B7QmKU8FORo`,
          },
          {
            token: '$CurrentAccount$',
            value: currentAccount.inst_profile,
          },
        ],
        blockModifyHelperParams: {
          taskGuid: casual.uuid,
        },
        disableWebPagePreview: true,
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

      }, timeout);

    });

  });

  it('should perform task message (like + comment) and its transformation to not done (no like) message with delay between them', async function () {

    return new Promise(async (resolve) => {

      this.timeout(100000);

      const messageDataPath = 'tasks.likes_comments';
      const messageData = _.get(pushMessage, messageDataPath, null);

      messageData.message.inline_keyboard[1] = [
        {
          "text": "COMMON_MSG_TASK_PERFORM_BTN",
          "callback_data": "push_msg_tsk_l_" + casual.uuid
        }
      ];

      const editMessageDataPath = 'tasks.likes_comments_no_like';
      const editMessageData = _.get(pushMessage, editMessageDataPath, null);

      editMessageData.message.inline_keyboard[1] = [
        {
          "text": "COMMON_MSG_TASK_PERFORM_BTN",
          "callback_data": "push_msg_tsk_l_" + casual.uuid
        }
      ];

      let msgRes, editMsgRes;

      msgRes = await sails.helpers.messageProcessor.sendMessageJoi({
        client,
        messageData,
        additionalTokens: [
          {
            token: '$PostLink$',
            value: `https://www.instagram.com/p/B7QmKU8FORo`,
          },
          {
            token: '$CurrentAccount$',
            value: currentAccount.inst_profile,
          },
        ],
        blockModifyHelperParams: {
          taskGuid: casual.uuid,
        },
        disableWebPagePreview: true,
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

      }, timeout);

    });

  });

  it('should perform task message (like + comment) and its transformation to not done (no comment) message with delay between them', async function () {

    return new Promise(async (resolve) => {

      this.timeout(100000);

      const messageDataPath = 'tasks.likes_comments';
      const messageData = _.get(pushMessage, messageDataPath, null);

      messageData.message.inline_keyboard[1] = [
        {
          "text": "COMMON_MSG_TASK_PERFORM_BTN",
          "callback_data": "push_msg_tsk_l_" + casual.uuid
        }
      ];

      const editMessageDataPath = 'tasks.likes_comments_no_comment';
      const editMessageData = _.get(pushMessage, editMessageDataPath, null);

      editMessageData.message.inline_keyboard[1] = [
        {
          "text": "COMMON_MSG_TASK_PERFORM_BTN",
          "callback_data": "push_msg_tsk_l_" + casual.uuid
        }
      ];

      let msgRes, editMsgRes;

      msgRes = await sails.helpers.messageProcessor.sendMessageJoi({
        client,
        messageData,
        additionalTokens: [
          {
            token: '$PostLink$',
            value: `https://www.instagram.com/p/B7QmKU8FORo`,
          },
          {
            token: '$CurrentAccount$',
            value: currentAccount.inst_profile,
          },
        ],
        blockModifyHelperParams: {
          taskGuid: casual.uuid,
        },
        disableWebPagePreview: true,
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

      }, timeout);

    });

  });

});

describe.skip('Test doc push message', function () {

  it('should send doc push message', async function () {

    this.timeout(100000);

    const client = await Client.findOne({
      guid: 'f079a758-a530-4c19-83fb-fca217c07639'
    });

    client.accounts = await Account.find({client: client.id});

    const messageData = {
      "id": "show_terms",
      "description": "Отправить условия предоставления услуг (документ)",
      "actionType": "doc",
      "initial": true,
      "enabled": true,
      "previous": null,
      "show_time": "now",
      "next": null,
      "shown": false,
      "beforeHelper": null,
      "afterHelper": null,
      "forcedHelper": null,
      "callbackHelper": null,
      "blockModifyHelper": null,
      "message": {
        "doc": "v1586616265/CY_Tax_2019.pdf",
        "html": [
          {
            "text": "MSG_STEP04",
            "style": "b",
            "cr": ""
          }
        ]
      }
    };

    const msgRes = await sails.helpers.messageProcessor.sendMessageJoi({
      client,
      messageData,
    });

  });

});

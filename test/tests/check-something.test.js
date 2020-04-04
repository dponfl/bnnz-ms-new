"use strict";

const {expect} = require('chai');
const mlog = require('mocha-logger');
const casual = require('casual');

describe('Test sending and updating Telegram message', function () {

  it ('should perform two messages actions with delay between them', async function () {

    return new Promise(async (resolve) => {

      this.timeout(100000);

      const client = await Client.findOne({
        guid: 'f079a758-a530-4c19-83fb-fca217c07639'
      });

      client.accounts = await Account.find({client: client.id});

      const messageData = {
        id: "start",
        description: "Задача: поставить лайк",
        actionType: "inline_keyboard",
        initial: true,
        enabled: true,
        previous: null,
        show_time: "now",
        next: null,
        shown: false,
        beforeHelper: null,
        afterHelper: null,
        forcedHelper: null,
        callbackHelper: null,
        blockModifyHelper: null,
        message: {
          html: [
            {
              text: "MSG_TASK_LIKE",
              style: "",
              cr: "DCR"
            },
            {
              text: "MSG_TASK",
              style: "",
              cr: ""
            }
          ],
          inline_keyboard: [
            [
              {
                text: "MSG_TASK_POST_LINK_BTN",
                url: "$PostLink$"
              }
            ],
            [
              {
                text: "MSG_TASK_PERFORM_BTN",
                callback_data: "push_msg_tsk_l_" + casual.uuid
              }
            ]
          ]
        }
      };

      const editMessageData = {
        id: "start",
        description: "Задание поставить лайк выполнено",
        actionType: "edit_message_text",
        initial: true,
        enabled: true,
        previous: null,
        show_time: "now",
        next: null,
        shown: false,
        beforeHelper: null,
        afterHelper: null,
        forcedHelper: null,
        callbackHelper: null,
        blockModifyHelper: null,
        message: {
          html: [
            {
              text: "MSG_TASK_LIKE_DONE",
              style: "",
              cr: "DCR"
            }
          ],
          inline_keyboard: [
          ]
        }
      };

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

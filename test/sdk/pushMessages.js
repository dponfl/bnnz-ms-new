"use strict";

const casual = require('casual');
const mlog = require('mocha-logger');

module.exports = {

  generateMessageData: async (messageType = null, data = null) => {
    const funcName = 'test:sdk:pushMessages:generateMessageData';

    let messageData;

    try {

      messageData = generateMessageData(messageType, data);

      return messageData;

    } catch (e) {
      mlog.error(`${funcName} Error: \ncode: ${e.code}\nmessage: ${e.message}\nclientRec: ${JSON.stringify(messageData)}`);
    }

  },

};

function generateMessageData(messageType = null, data = null) {
  const funcName = 'pushMessages:generateMessageData';

  let messageData;

  try {

    switch (messageType) {
      case 'likes':
        messageData = {
          id: "start",
          description: "Задача: поставить лайк",
          actionType: "text",
          initial: true,
          enabled: true,
          previous: null,
          show_time: "now",
          next: null,
          shown: false,
          beforeHelper: null,
          afterHelper: null,
          forcedHelper: null,
          callbackHelper: "tasks::callbackLikes",
          blockModifyHelper: "tasks::blockModifyLikes",
          message: {
            html: [
              {
                text: "MSG_TASK_LIKE",
                style: "",
                cr: "SCR"
              },
              {
                text: "MSG_TASK_POST_LINK",
                style: "b",
                cr: "DCR"
              },
              {
                text: "MSG_TASK",
                style: "bi",
                cr: ""
              }
            ],
            inline_keyboard: [
            ]
          }
        };
        break;
      case 'comments_likes':
        messageData = {
          id: "start",
          description: "Задача: оставить комментарий и поставить лайк",
          actionType: "text",
          initial: true,
          enabled: true,
          previous: null,
          show_time: "now",
          next: null,
          shown: false,
          beforeHelper: null,
          afterHelper: null,
          forcedHelper: null,
          callbackHelper: "tasks::callbackLikesComments",
          blockModifyHelper: "tasks::blockModifyLikesComments",
          message: {
            html: [
              {
                text: "MSG_TASK_LIKE_COMMENT",
                style: "",
                cr: "SCR"
              },
              {
                text: "MSG_TASK_POST_LINK",
                style: "b",
                cr: "DCR"
              },
              {
                text: "MSG_TASK",
                style: "bi",
                cr: ""
              }
            ],
            inline_keyboard: [
            ]
          }
        };
        break;
      default:
        messageData = {
          id: "start",
          description: "Задача: поставить лайк",
          actionType: "text",
          initial: true,
          enabled: true,
          previous: null,
          show_time: "now",
          next: null,
          shown: false,
          beforeHelper: null,
          afterHelper: null,
          forcedHelper: null,
          callbackHelper: "tasks::callbackLikes",
          blockModifyHelper: "tasks::blockModifyLikes",
          message: {
            html: [
              {
                text: "MSG_TASK_LIKE",
                style: "",
                cr: "SCR"
              },
              {
                text: "MSG_TASK_POST_LINK",
                style: "b",
                cr: "DCR"
              },
              {
                text: "MSG_TASK",
                style: "bi",
                cr: ""
              }
            ],
            inline_keyboard: [
            ]
          }
        };
    }

    if (data != null) {
      messageData = _.assign(messageData, data);
    }

    return messageData;

  } catch (e) {
    mlog.error(`${funcName} Error: \ncode: ${e.code}\nmessage: ${e.message}\nclientRec: ${JSON.stringify(messageData)}`);
  }
}
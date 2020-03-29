"use strict";

const casual = require('casual');
const mlog = require('mocha-logger');
const uuid = require('uuid-apikey');
const moment = require('moment');

module.exports = {

  deleteAllMessages: async () => {
    const funcName = 'test:sdk:messages:deleteAllMessages';
    try {
      await Messages.destroy({});
    } catch (e) {
      mlog.error(`${funcName} Error: code: ${e.code}, message: ${e.message}`);
    }
  },

  deleteMessageByGuid: async (messageGuid) => {
    const funcName = 'test:sdk:messages:deleteMessageByGuid';
    try {
      await Messages.destroy({guid: messageGuid});
    } catch (e) {
      mlog.error(`${funcName} Error: code: ${e.code}, message: ${e.message}`);
    }
  },

  generateMessageDB: async (message = null) => {
    const funcName = 'test:sdk:messages:generateMessageDB';

    let messageRec;

    try {

      messageRec = await generateMessage(message);
      messageRec = _.omit(messageRec, ['id', 'createdAt', 'updatedAt']);

      messageRec = await Messages.create(messageRec).fetch();


      return messageRec;

    } catch (e) {
      mlog.error(`${funcName} Error: \ncode: ${e.code}\nmessage: ${e.message}\nmessageRec: ${JSON.stringify(messageRec)}`);
    }

  },

  generateMessage: async (message = null) => {
    const funcName = 'test:sdk:messages:generateMessage';

    let messageRec;

    try {

      messageRec = await generateMessage(message);

      return messageRec;

    } catch (e) {
      mlog.error(`${funcName} Error: \ncode: ${e.code}\nmessage: ${e.message}\nmessageRec: ${JSON.stringify(messageRec)}`);
    }

  },

};

async function generateMessage(message = null) {
  const funcName = 'messages:generateMessage';

  let messageRec;

  try {

    messageRec = {
      id: casual.integer(1, 1000),
      message: casual.string,
      callback_query_id: casual.uuid,
      message_id: casual.integer(1000, 1000000),
      message_format: sails.config.custom.enums.messageFormat.CALLBACK,
      messenger: sails.config.custom.enums.messenger.TELEGRAM,
      message_originator: sails.config.custom.enums.messageOriginator.CLIENT,
      client_id: casual.integer(1000, 1000000),
      client_guid: casual.uuid,
      createdAt: moment().format(),
      updatedAt: moment().add(1, 'minutes').format(),
    };

    if (message != null) {
      messageRec = _.assign(messageRec, message);
    }

    return messageRec;

  } catch (e) {
    mlog.error(`${funcName} Error: \ncode: ${e.code}\nmessage: ${e.message}\nmessageRec: ${JSON.stringify(messageRec)}`);
  }
}
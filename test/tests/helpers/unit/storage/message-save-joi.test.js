"use strict";

const {expect} = require('chai');
const mlog = require('mocha-logger');
const casual = require('casual');

describe('storage.messageSaveJoi test', () => {

    it ('should fail for wrong "messenger" param', async () => {
      try {
        const paramsObj = {
          message: 'Some message...',
          callback_query_id: casual.uuid,
          message_format: sails.config.custom.enums.messageFormat.SIMPLE,
          messenger: 'Facebook Messenger',
          message_originator: sails.config.custom.enums.messageOriginator.BOT,
          client_id: casual.integer(1000, 1000000),
          client_guid: casual.uuid,
        };
        await sails.helpers.storage.messageSaveJoi(paramsObj);
      } catch (e) {
        // mlog.error(`e:\n${JSON.stringify(e, null, 3)}`);
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"messenger" must be [telegram]');
      }
    });

    it ('should fail for missing "client_guid" param', async () => {
      try {
        const paramsObj = {
          message: 'Some message...',
          callback_query_id: casual.uuid,
          message_format: sails.config.custom.enums.messageFormat.SIMPLE,
          messenger: sails.config.custom.enums.messenger.TELEGRAM,
          message_originator: sails.config.custom.enums.messageOriginator.BOT,
          client_id: casual.integer(1000, 1000000),
        };
        await sails.helpers.storage.messageSaveJoi(paramsObj);
      } catch (e) {
        // mlog.error(`e:\n${JSON.stringify(e, null, 3)}`);
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"client_guid" is required');
      }
    });

    it ('should create record', async () => {
      try {
        const paramsObj = {
          message: 'Some message...',
          callback_query_id: casual.uuid,
          message_format: sails.config.custom.enums.messageFormat.SIMPLE,
          messenger: sails.config.custom.enums.messenger.TELEGRAM,
          message_originator: sails.config.custom.enums.messageOriginator.BOT,
          client_id: casual.integer(1000, 1000000),
          client_guid: casual.uuid,
        };
        const messageRec = await sails.helpers.storage.messageSaveJoi(paramsObj);
        // mlog.log(`messageRec:\n${JSON.stringify(messageRec, null, 3)}`);
        const messageRecFromDB = await Messages.findOne({
          message_guid: messageRec.payload.message_guid,
        });

        expect(messageRecFromDB).to.include(_.omit(paramsObj, ['message', 'message_buttons']));
      } catch (e) {
        mlog.error(`Error:\n${JSON.stringify(e, null, 3)}`);
        expect.fail();
      }
    });

});

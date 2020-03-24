"use strict";

const {expect} = require('chai');
const sinon = require('sinon');
const mlog = require('mocha-logger');
const casual = require('casual');

describe('mgw:telegram:simpleMessageJoi test', function () {

  let config;

  before(async function () {
    const configRaw =   await sails.helpers.general.getConfig();
    config = configRaw.payload;
  });

  describe('Check input params', function () {

    it ('should fail for missing "chatId" param', async () => {

      try {

        const params = {
          html: casual.word,
        };

        await sails.helpers.mgw.telegram.simpleMessageJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.err.payload.error.details[0]).to.have.property('message', '"chatId" is required');
      }

    });

    it ('should fail for missing "html" param', async () => {

      try {

        const params = {
          chatId: casual.word,
        };

        await sails.helpers.mgw.telegram.simpleMessageJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.err.payload.error.details[0]).to.have.property('message', '"html" is required');
      }

    });

  });

  describe('Call Telegram API sendMessage', function () {

    let sendMessageStub;

    before(function () {
      sendMessageStub = sinon.stub(config.telegramBot, 'sendMessage');
    });

    after(function () {
      sendMessageStub.reset();
    });

    it('should successfully call sendMessage', async function () {

      sendMessageStub.returns('sendMessageStub result');

      try {

        const params = {
          chatId: casual.word,
          html: casual.word,
        };

        const simpleMessageJoiRes = await sails.helpers.mgw.telegram.simpleMessageJoi(params);

        expect(sendMessageStub.callCount).to.be.eq(1);
        expect(simpleMessageJoiRes).to.deep.include({
          status: 'ok',
          message: 'Telegram simple message was sent',
          payload: 'sendMessageStub result',
        });

      } catch (e) {
        expect.fail('Unexpected error');
      }

    });


  });

});

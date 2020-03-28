"use strict";

const {expect} = require('chai');
const sinon = require('sinon');
const casual = require('casual');

describe('mgw:telegram:forcedMessageJoi test', function () {

  let customConfig;

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;
  });

  describe('Check input params', function () {

    it('should fail for missing "chatId" param', async () => {

      try {

        const params = {
          html: casual.word,
        };

        await sails.helpers.mgw.telegram.forcedMessageJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.deep.include({message: '"chatId" is required'});
      }

    });

    it ('should fail for missing "html" param', async () => {

      try {

        const params = {
          chatId: casual.word,
        };

        await sails.helpers.mgw.telegram.forcedMessageJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.deep.include({message: '"html" is required'});
      }

    });

  });

  describe('Call Telegram API forcedMessage', function () {

    let sendMessageStub;

    before(function () {
      sendMessageStub = sinon.stub(customConfig.telegramBot, 'sendMessage');
    });

    after(function () {
      sendMessageStub.restore();
    });

    it('should successfully call videoMessage', async function () {

      sendMessageStub.returns('sendMessageStub result');

      try {

        const params = {
          chatId: casual.word,
          html: casual.word,
        };

        const forcedMessageJoiRes = await sails.helpers.mgw.telegram.forcedMessageJoi(params);

        expect(sendMessageStub.callCount).to.be.eq(1);
        expect(forcedMessageJoiRes).to.deep.include({
          status: 'ok',
          message: 'Telegram forced message was sent',
          payload: 'sendMessageStub result',
        });

      } catch (e) {
        expect.fail(`Unexpected error: \n${JSON.stringify(e, null, 3)}`);
      }

    });

  });

});

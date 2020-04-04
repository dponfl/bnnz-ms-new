"use strict";

const {expect} = require('chai');
const sinon = require('sinon');
const casual = require('casual');

describe('mgw:telegram:deleteMessageJoi test (unit)', function () {

  let config;

  before(async function () {
    const configRaw =   await sails.helpers.general.getConfig();
    config = configRaw.payload;
  });

  describe('Check input params', function () {

    it ('should fail for missing "chatId" param', async () => {

      try {

        const params = {
          messageId: casual.word,
        };

        await sails.helpers.mgw.telegram.deleteMessageJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.err.payload.error.details[0]).to.have.property('message', '"chatId" is required');
      }

    });

    it ('should fail for missing "messageId" param', async () => {

      try {

        const params = {
          chatId: casual.word,
        };

        await sails.helpers.mgw.telegram.deleteMessageJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.err.payload.error.details[0]).to.have.property('message', '"messageId" is required');
      }

    });

  });

  describe('Call Telegram API deleteMessage', function () {

    let deleteMessageStub;

    before(function () {
      deleteMessageStub = sinon.stub(config.telegramBot, 'deleteMessage');
    });

    after(function () {
      deleteMessageStub.restore();
    });

    it('should successfully call deleteMessage', async function () {

      deleteMessageStub.returns('deleteMessageStub result');

      try {

        const params = {
          chatId: casual.word,
          messageId: casual.word,
        };

        const deleteMessageJoiRes = await sails.helpers.mgw.telegram.deleteMessageJoi(params);

        expect(deleteMessageStub.callCount).to.be.eq(1);
        expect(deleteMessageJoiRes).to.deep.include({
          status: 'ok',
          message: 'Telegram message was deleted',
          payload: 'deleteMessageStub result',
        });

      } catch (e) {
        expect.fail('Unexpected error');
      }

    });


  });

});

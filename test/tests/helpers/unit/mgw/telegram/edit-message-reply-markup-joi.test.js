"use strict";

const {expect} = require('chai');
const sinon = require('sinon');
const casual = require('casual');

describe('mgw:telegram:editMessageReplyMarkupJoi test (unit)', function () {

  let config;

  before(async function () {
    const configRaw =   await sails.helpers.general.getConfig();
    config = configRaw.payload;
  });

  describe('Check input params', function () {

    it ('should fail for missing "replyMarkup" param', async () => {

      try {

        const params = {
          optionalParams: {
            someKey: 'someValue',
          },
        };

        await sails.helpers.mgw.telegram.editMessageReplyMarkupJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.err.payload.error.details[0]).to.have.property('message', '"replyMarkup" is required');
      }

    });

    it ('should fail for missing "optionalParams" param', async () => {

      try {

        const params = {
          replyMarkup: {
            inline_keyboard: [
              {
                key: 'value',
              }
            ]
          },
        };

        await sails.helpers.mgw.telegram.editMessageReplyMarkupJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.err.payload.error.details[0]).to.have.property('message', '"optionalParams" is required');
      }

    });

  });

  describe('Call Telegram API editMessageReplyMarkup', function () {

    let editMessageReplyMarkupStub;

    before(function () {
      editMessageReplyMarkupStub = sinon.stub(config.telegramBot, 'editMessageReplyMarkup');
    });

    after(function () {
      editMessageReplyMarkupStub.restore();
    });

    it('should successfully call deleteMessage', async function () {

      editMessageReplyMarkupStub.returns('editMessageReplyMarkupStub result');

      try {

        const params = {
          replyMarkup: {
            inline_keyboard: [
              {
                key: 'value',
              }
            ]
          },
          optionalParams: {
            someKey: 'someValue',
          },
        };

        const editMessageReplyMarkupJoiRes = await sails.helpers.mgw.telegram.editMessageReplyMarkupJoi(params);

        expect(editMessageReplyMarkupStub.callCount).to.be.eq(1);
        expect(editMessageReplyMarkupJoiRes).to.deep.include({
          status: 'ok',
          message: 'Telegram message reply markup was edited',
          payload: 'editMessageReplyMarkupStub result',
        });

      } catch (e) {
        expect.fail('Unexpected error');
      }

    });


  });

});

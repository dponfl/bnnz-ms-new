"use strict";

const {expect} = require('chai');
const sinon = require('sinon');
const casual = require('casual');

describe('mgw:telegram:editMessageTextJoi test (unit)', function () {

  let config;

  before(async function () {
    const configRaw =   await sails.helpers.general.getConfig();
    config = configRaw.payload;
  });

  describe('Check input params', function () {

    it ('should fail for missing "html" param', async () => {

      try {

        const params = {
          optionalParams: {
            someKey: 'someValue',
          },
        };

        await sails.helpers.mgw.telegram.editMessageTextJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.err.payload.error.details[0]).to.have.property('message', '"html" is required');
      }

    });

    it ('should fail for missing "optionalParams" param', async () => {

      try {

        const params = {
          html: casual.word,
        };

        await sails.helpers.mgw.telegram.editMessageTextJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.err.payload.error.details[0]).to.have.property('message', '"optionalParams" is required');
      }

    });

  });

  describe('Call Telegram API editMessageText', function () {

    let editMessageTextStub;

    before(function () {
      editMessageTextStub = sinon.stub(config.telegramBot, 'editMessageText');
    });

    after(function () {
      editMessageTextStub.restore();
    });

    it('should successfully call deleteMessage', async function () {

      editMessageTextStub.returns('editMessageTextStub result');

      try {

        const params = {
          html: casual.word,
          optionalParams: {
            someKey: 'someValue',
          },
        };

        const editMessageTextJoiRes = await sails.helpers.mgw.telegram.editMessageTextJoi(params);

        expect(editMessageTextStub.callCount).to.be.eq(1);
        expect(editMessageTextJoiRes).to.deep.include({
          status: 'ok',
          message: 'Telegram message was edited',
          payload: 'editMessageTextStub result',
        });

      } catch (e) {
        expect.fail('Unexpected error');
      }

    });


  });

});

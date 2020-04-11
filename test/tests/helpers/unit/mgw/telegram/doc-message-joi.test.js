"use strict";

const {expect} = require('chai');
const sinon = require('sinon');
const casual = require('casual');

describe('mgw:telegram:docMessageJoi test', function () {

  let customConfig;

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;
  });

  describe('Check input params', function () {

    it('should fail for missing "chatId" param', async () => {

      try {

        const params = {
          docPath: `https://${casual.url}/${casual.uuid}`,
          html: casual.word,
        };

        await sails.helpers.mgw.telegram.docMessageJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.deep.include({message: '"chatId" is required'});
      }

    });

    it ('should fail for missing "docPath" param', async () => {

      try {

        const params = {
          chatId: casual.word,
        };

        await sails.helpers.mgw.telegram.docMessageJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.deep.include({message: '"docPath" is required'});
      }

    });

    it ('should fail for invalid "docPath" param', async () => {

      try {

        const params = {
          chatId: casual.word,
          docPath: casual.word,
          html: casual.word,
        };

        await sails.helpers.mgw.telegram.docMessageJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.deep.include({message: '"docPath" must be a valid uri'});
      }

    });

  });

  describe('Call Telegram API videoMessage', function () {

    let docMessageStub;

    before(function () {
      docMessageStub = sinon.stub(customConfig.telegramBot, 'sendDocument');
    });

    after(function () {
      docMessageStub.restore();
    });

    it('should successfully call videoMessage', async function () {

      docMessageStub.returns('docMessageStub result');

      try {

        const params = {
          chatId: casual.word,
          docPath: `https://${casual.url}/${casual.uuid}`,
          html: casual.word,
        };

        const docMessageJoiRes = await sails.helpers.mgw.telegram.docMessageJoi(params);

        expect(docMessageStub.callCount).to.be.eq(1);
        expect(docMessageJoiRes).to.deep.include({
          status: 'ok',
          message: 'Telegram doc message was sent',
          payload: 'docMessageStub result',
        });

      } catch (e) {
        expect.fail(`Unexpected error: \n${JSON.stringify(e, null, 3)}`);
      }

    });


  });

});

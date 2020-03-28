"use strict";

const {expect} = require('chai');
const sinon = require('sinon');
const casual = require('casual');

describe('mgw:telegram:imgMessageJoi test', function () {

  let customConfig;

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;
  });

  describe('Check input params', function () {

    it('should fail for missing "chatId" param', async () => {

      try {

        const params = {
          imgPath: `https://${casual.url}/${casual.uuid}`,
          html: casual.word,
        };

        await sails.helpers.mgw.telegram.imgMessageJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.deep.include({message: '"chatId" is required'});
      }

    });

    it ('should fail for missing "imgPath" param', async () => {

      try {

        const params = {
          chatId: casual.word,
        };

        await sails.helpers.mgw.telegram.imgMessageJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.deep.include({message: '"imgPath" is required'});
      }

    });

    it ('should fail for invalid "imgPath" param', async () => {

      try {

        const params = {
          chatId: casual.word,
          imgPath: casual.word,
          html: casual.word,
        };

        await sails.helpers.mgw.telegram.imgMessageJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.deep.include({message: '"imgPath" must be a valid uri'});
      }

    });

  });

  describe('Call Telegram API imgMessage', function () {

    let imgMessageStub;

    before(function () {
      imgMessageStub = sinon.stub(customConfig.telegramBot, 'sendPhoto');
    });

    after(function () {
      imgMessageStub.reset();
    });

    it('should successfully call imgMessage', async function () {

      imgMessageStub.returns('imgMessageStub result');

      try {

        const params = {
          chatId: casual.word,
          imgPath: `https://${casual.url}/${casual.uuid}`,
          html: casual.word,
        };

        const imgMessageJoiRes = await sails.helpers.mgw.telegram.imgMessageJoi(params);

        expect(imgMessageStub.callCount).to.be.eq(1);
        expect(imgMessageJoiRes).to.deep.include({
          status: 'ok',
          message: 'Telegram img message was sent',
          payload: 'imgMessageStub result',
        });

      } catch (e) {
        expect.fail(`Unexpected error: \n${JSON.stringify(e, null, 3)}`);
      }

    });


  });

});

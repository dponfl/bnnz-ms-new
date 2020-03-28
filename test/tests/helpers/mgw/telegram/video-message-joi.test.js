"use strict";

const {expect} = require('chai');
const sinon = require('sinon');
const casual = require('casual');

describe('mgw:telegram:videoMessageJoi test', function () {

  let customConfig;

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;
  });

  describe('Check input params', function () {

    it('should fail for missing "chatId" param', async () => {

      try {

        const params = {
          videoPath: `https://${casual.url}/${casual.uuid}`,
          html: casual.word,
        };

        await sails.helpers.mgw.telegram.videoMessageJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.deep.include({message: '"chatId" is required'});
      }

    });

    it ('should fail for missing "videoPath" param', async () => {

      try {

        const params = {
          chatId: casual.word,
        };

        await sails.helpers.mgw.telegram.videoMessageJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.deep.include({message: '"videoPath" is required'});
      }

    });

    it ('should fail for invalid "videoPath" param', async () => {

      try {

        const params = {
          chatId: casual.word,
          videoPath: casual.word,
          html: casual.word,
        };

        await sails.helpers.mgw.telegram.videoMessageJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.deep.include({message: '"videoPath" must be a valid uri'});
      }

    });

  });

  describe('Call Telegram API videoMessage', function () {

    let videoMessageStub;

    before(function () {
      videoMessageStub = sinon.stub(customConfig.telegramBot, 'sendVideo');
    });

    after(function () {
      videoMessageStub.reset();
    });

    it('should successfully call videoMessage', async function () {

      videoMessageStub.returns('videoMessageStub result');

      try {

        const params = {
          chatId: casual.word,
          videoPath: `https://${casual.url}/${casual.uuid}`,
          html: casual.word,
        };

        const videoMessageJoiRes = await sails.helpers.mgw.telegram.videoMessageJoi(params);

        expect(videoMessageStub.callCount).to.be.eq(1);
        expect(videoMessageJoiRes).to.deep.include({
          status: 'ok',
          message: 'Telegram video message was sent',
          payload: 'videoMessageStub result',
        });

      } catch (e) {
        expect.fail(`Unexpected error: \n${JSON.stringify(e, null, 3)}`);
      }

    });


  });

});

"use strict";

const {expect} = require('chai');
const sinon = require('sinon');
const mlog = require('mocha-logger');
const casual = require('casual');
const clientSdk = require('../../../sdk/client');
const pushMessagesSdk = require('../../../sdk/pushMessages');

describe('messageProcessor:sendMessageJoi test', function () {

  let config, pushMessages;

  before(async function () {
    const configRaw =   await sails.helpers.general.getConfig();
    config = configRaw.payload;
    pushMessages = config.pushMessages;
  });

  describe('Check input params', function () {

    it ('should fail for missing "client" param', async () => {

      try {

        const messageData = await pushMessagesSdk.generateMessageData('likes');

        const params = {
          messageData,
          additionalTokens: [
            {
              token: '$PostLink$',
              value: config.config.general.instagram_post_prefix + casual.uuid,
            },
          ],
        };

        await sails.helpers.messageProcessor.sendMessageJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"client" is required');
      }

    });

    it('should fail for missing "messageData" param', async () => {

      const client = await clientSdk.generateClient();

      try {

        const params = {
          client: client,
          additionalTokens: [
            {
              token: '$PostLink$',
              value: config.config.general.instagram_post_prefix + casual.uuid,
            },
          ],
        };

        await sails.helpers.messageProcessor.sendMessageJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"messageData" is required');
      }

    });

  });

  describe('Perform messageProcessor:sendMessageJoi', function () {

    let parseMessageStyleJoiStub;
    let simpleMessageJoiStub;
    let messageSaveJoiStub;


    before(function () {
      parseMessageStyleJoiStub = sinon.stub(sails.helpers.messageProcessor, 'parseMessageStyleJoi');
      simpleMessageJoiStub = sinon.stub(sails.helpers.mgw.telegram, 'simpleMessageJoi');
      messageSaveJoiStub = sinon.stub(sails.helpers.storage, 'messageSaveJoi');
    });

    after(function () {
      parseMessageStyleJoiStub.restore();
      simpleMessageJoiStub.restore();
      messageSaveJoiStub.restore();
    });

    describe('Perform "simpleMessage"', function () {

      it('should successfully perform simple text message', async function () {

        try {

          parseMessageStyleJoiStub.returns('htmlSimple string');
          simpleMessageJoiStub
            .returns({
              status: 'ok',
              message: 'Telegram simple message was sent',
              payload: 'some payload',
            });

          const client = await clientSdk.generateClient();
          const messageData = await pushMessagesSdk.generateMessageData('likes', {
            actionType: 'text',
          });
          const params = {
            client,
            messageData,
          };

          const sendMessageJoiRes = await sails.helpers.messageProcessor.sendMessageJoi(params);

          expect(parseMessageStyleJoiStub.callCount).to.be.eq(1);
          expect(simpleMessageJoiStub.callCount).to.be.eq(1);
          expect(messageSaveJoiStub.callCount).to.be.eq(1);
          expect(sendMessageJoiRes).to.deep.include({
            status: 'ok',
            message: 'Telegram simple message was sent',
            payload: 'some payload',
          });

        } catch (e) {
          expect.fail('Unexpected error');
        }


      });

      // Добавить проверку вызова blockModifyHelper

      // Добавить проверку вызова beforeHelper

      // Добавить проверку вызова afterHelper

      // В тесты по остальным типам сообщений добавить только beforeHelper
      // потому что остальные хелперы вызываются вне зависимости от типа сообщения

    });

    describe.skip('Perform "xxx"', function () {



    });

  });

});

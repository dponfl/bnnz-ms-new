"use strict";

const sails = require('sails');

const {expect} = require('chai');
const sinon = require('sinon');
const mlog = require('mocha-logger');
const casual = require('casual');
const clientSdk = require('../../../../sdk/client');
const pushMessagesSdk = require('../../../../sdk/pushMessages');

describe('messageProcessor:sendMessageJoi test', function () {

  let customConfig, customConfigGeneral;
  let inlineKeyboard;

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;
    customConfigGeneral = customConfig.config.general;

    inlineKeyboard = [
      [
        {
          "text": "MSG_OPTIN_GENERAL_INFO_BTN_YES",
          "callback_data": "general_info_yes"
        }
      ],
      [
        {
          "text": "MSG_OPTIN_GENERAL_INFO_BTN_NO",
          "callback_data": "general_info_no"
        }
      ]
    ];

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
              value: customConfig.config.general.instagram_post_prefix + casual.uuid,
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
              value: customConfig.config.general.instagram_post_prefix + casual.uuid,
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

    let parseMessageStyleStub;
    let performBlockModifyHelperStub;
    let mapDeepStub;
    let simpleMessageJoiStub;
    let imgMessageJoiStub;
    let videoMessageJoiStub;
    let forcedMessageJoiStub;
    let inlineKeyboardMessageJoiStub;
    let messageSaveJoiStub;


    beforeEach(function () {
      parseMessageStyleStub = sinon.stub(sails.services.messageprocessor, 'parseMessageStyle');
      performBlockModifyHelperStub = sinon.stub(sails.helpers.messageProcessor, 'performBlockModifyHelperJoi');
      mapDeepStub = sinon.stub(sails.services.messageprocessor, 'mapDeep');
      simpleMessageJoiStub = sinon.stub(sails.helpers.mgw.telegram, 'simpleMessageJoi');
      imgMessageJoiStub = sinon.stub(sails.helpers.mgw.telegram, 'imgMessageJoi');
      videoMessageJoiStub = sinon.stub(sails.helpers.mgw.telegram, 'videoMessageJoi');
      forcedMessageJoiStub = sinon.stub(sails.helpers.mgw.telegram, 'forcedMessageJoi');
      inlineKeyboardMessageJoiStub = sinon.stub(sails.helpers.mgw.telegram, 'inlineKeyboardMessageJoi');
      messageSaveJoiStub = sinon.stub(sails.helpers.storage, 'messageSaveJoi');
    });

    afterEach(function () {
      mapDeepStub.restore();
      parseMessageStyleStub.restore();
      performBlockModifyHelperStub.restore();
      simpleMessageJoiStub.restore();
      imgMessageJoiStub.restore();
      videoMessageJoiStub.restore();
      forcedMessageJoiStub.restore();
      inlineKeyboardMessageJoiStub.restore();
      messageSaveJoiStub.restore();
    });

    describe('Perform "simpleMessageJoi"', function () {

      it('should successfully perform simple text message', async function () {

        try {

          parseMessageStyleStub.returns('htmlSimple string');
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
          const additionalTokens = [
            {
              token: '$PostLink$',
              value: customConfig.config.general.instagram_post_prefix + casual.uuid,
            },
          ];
          const blockModifyHelperParams = {
            taskGuid: casual.uuid,
          };

          performBlockModifyHelperStub.returns(messageData);

          const params = {
            client,
            messageData,
            additionalTokens,
            blockModifyHelperParams,
          };

          const sendMessageJoiRes = await sails.helpers.messageProcessor.sendMessageJoi(params);

          expect(parseMessageStyleStub.callCount).to.be.eq(1);
          expect(simpleMessageJoiStub.callCount).to.be.eq(1);
          expect(messageSaveJoiStub.callCount).to.be.eq(1);
          expect(sendMessageJoiRes).to.deep.include({
            status: 'ok',
            message: 'Telegram simple message was sent',
            payload: 'some payload',
          });

        } catch (e) {
          expect.fail(`Unexpected error: \n${JSON.stringify(e, null, 3)}`);
        }

      });

      // Добавить проверку вызова beforeHelper

      // Добавить проверку вызова afterHelper

      // В тесты по остальным типам сообщений добавить только beforeHelper
      // потому что остальные хелперы вызываются вне зависимости от типа сообщения

    });

    describe('Perform "imgMessageJoi"', function () {

      it('should successfully perform img message', async function () {

        try {

          parseMessageStyleStub.returns('htmlImg string');
          imgMessageJoiStub
            .returns({
              status: 'ok',
              message: 'Telegram img message was sent',
              payload: 'some payload of imgMessageJoiStub',
            });

          const client = await clientSdk.generateClient();
          const messageData = await pushMessagesSdk.generateMessageData('likes', {
            actionType: 'img',
          });
          const blockModifyHelperParams = {
            taskGuid: casual.uuid,
          };

          performBlockModifyHelperStub.returns(messageData);

          const params = {
            client,
            messageData,
            blockModifyHelperParams,
          };

          const sendMessageJoiRes = await sails.helpers.messageProcessor.sendMessageJoi(params);

          expect(parseMessageStyleStub.callCount).to.be.eq(1);
          expect(imgMessageJoiStub.callCount).to.be.eq(1);
          expect(messageSaveJoiStub.callCount).to.be.eq(1);
          expect(sendMessageJoiRes).to.deep.include({
            status: 'ok',
            message: 'Telegram img message was sent',
            payload: 'some payload of imgMessageJoiStub',
          });

        } catch (e) {
          expect.fail(`Unexpected error: \n${JSON.stringify(e, null, 3)}`);
        }

      });

    });

    describe('Perform "videoMessageJoi"', function () {

      it('should successfully perform img message', async function () {

        try {

          parseMessageStyleStub.returns('htmlVideo string');
          videoMessageJoiStub
            .returns({
              status: 'ok',
              message: 'Telegram video message was sent',
              payload: 'some payload of videoMessageJoiStub',
            });

          const client = await clientSdk.generateClient();
          const messageData = await pushMessagesSdk.generateMessageData('likes', {
            actionType: 'video',
          });
          const blockModifyHelperParams = {
            taskGuid: casual.uuid,
          };

          performBlockModifyHelperStub.returns(messageData);

          const params = {
            client,
            messageData,
            blockModifyHelperParams,
          };

          const sendMessageJoiRes = await sails.helpers.messageProcessor.sendMessageJoi(params);

          expect(parseMessageStyleStub.callCount).to.be.eq(1);
          expect(videoMessageJoiStub.callCount).to.be.eq(1);
          expect(messageSaveJoiStub.callCount).to.be.eq(1);
          expect(sendMessageJoiRes).to.deep.include({
            status: 'ok',
            message: 'Telegram video message was sent',
            payload: 'some payload of videoMessageJoiStub',
          });

        } catch (e) {
          expect.fail(`Unexpected error: \n${JSON.stringify(e, null, 3)}`);
        }

      });

    });

    describe('Perform "forcedMessageJoi"', function () {

      it('should successfully perform forced message', async function () {

        try {

          parseMessageStyleStub.returns('htmlVideo string');
          forcedMessageJoiStub
            .returns({
              status: 'ok',
              message: 'Telegram forced message was sent',
              payload: 'some payload of forcedMessageJoiStub',
            });

          const client = await clientSdk.generateClient();
          const messageData = await pushMessagesSdk.generateMessageData('likes', {
            actionType: 'forced',
          });
          const blockModifyHelperParams = {
            taskGuid: casual.uuid,
          };

          performBlockModifyHelperStub.returns(messageData);

          const params = {
            client,
            messageData,
            blockModifyHelperParams,
          };

          const sendMessageJoiRes = await sails.helpers.messageProcessor.sendMessageJoi(params);

          expect(parseMessageStyleStub.callCount).to.be.eq(1);
          expect(forcedMessageJoiStub.callCount).to.be.eq(1);
          expect(messageSaveJoiStub.callCount).to.be.eq(1);
          expect(sendMessageJoiRes).to.deep.include({
            status: 'ok',
            message: 'Telegram forced message was sent',
            payload: 'some payload of forcedMessageJoiStub',
          });

        } catch (e) {
          expect.fail(`Unexpected error: \n${JSON.stringify(e, null, 3)}`);
        }

      });

    });

    describe('Perform "inlineKeyboardMessageJoi"', function () {

      it('should successfully perform forced message', async function () {

        try {

          parseMessageStyleStub.returns('htmlInline string');
          mapDeepStub.returns(inlineKeyboard);
          inlineKeyboardMessageJoiStub
            .returns({
              status: 'ok',
              message: 'Telegram inline keyboard message was sent',
              payload: 'some payload of inlineKeyboardMessageJoiStub',
            });

          const client = await clientSdk.generateClient();
          const messageData = await pushMessagesSdk.generateMessageData('likes', {
            actionType: 'inline_keyboard',
          });
          const blockModifyHelperParams = {
            taskGuid: casual.uuid,
          };

          performBlockModifyHelperStub.returns(messageData);

          const params = {
            client,
            messageData,
            blockModifyHelperParams,
          };

          const sendMessageJoiRes = await sails.helpers.messageProcessor.sendMessageJoi(params);

          expect(parseMessageStyleStub.callCount).to.be.eq(1);
          expect(inlineKeyboardMessageJoiStub.callCount).to.be.eq(1);
          expect(messageSaveJoiStub.callCount).to.be.eq(1);
          expect(sendMessageJoiRes).to.deep.include({
            status: 'ok',
            message: 'Telegram inline keyboard message was sent',
            payload: 'some payload of inlineKeyboardMessageJoiStub',
          });

        } catch (e) {
          expect.fail(`Unexpected error: \n${JSON.stringify(e, null, 3)}`);
        }

      });

    });

  });

});

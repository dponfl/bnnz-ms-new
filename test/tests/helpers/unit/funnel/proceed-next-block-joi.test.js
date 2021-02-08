"use strict";

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
const mlog = require('mocha-logger');
const casual = require('casual');
const clientSdk = require('../../../../sdk/client');
const accountSdk = require('../../../../sdk/account.js');

chai.use(sinonChai);


describe('funnel.proceedNextBlockJoi test', function () {

  let customConfig, customConfigGeneral;

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;
    customConfigGeneral = customConfig.config.general;
  });

  describe('Check input params', function () {

    it ('should fail for missing "client" param', async () => {

      try {

        const funnelName = casual.word;
        const blockId = casual.word;
        const params = {
          funnelName,
          blockId,
        };

        await sails.helpers.funnel.proceedNextBlockJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.deep.include({message: '"client" is required'});
      }

    });

    it ('should fail for missing "funnelName" param', async () => {

      try {

        const client = await clientSdk.generateClient();
        const blockId = casual.word;
        const params = {
          client,
          blockId,
        };

        await sails.helpers.funnel.proceedNextBlockJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.deep.include({message: '"funnelName" is required'});
      }

    });

    it ('should fail for missing "blockId" param', async () => {

      try {

        const client = await clientSdk.generateClient();
        const funnelName = casual.word;
        const params = {
          client,
          funnelName,
        };

        await sails.helpers.funnel.proceedNextBlockJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.deep.include({message: '"blockId" is required'});
      }

    });

  });

  describe('Check errors related to funnels data structure', function () {

    let client;

    beforeEach(async function () {
      client = await clientSdk.generateClient();
      client.funnels = {
        optin: [
          {
            "id": "step01",
            "description": "",
            "actionType": "text",
            "initial": true,
            "enabled": true,
            "show_time": 0,
            "previous": null,
            "next": "optin::step02",
            "switchToFunnel": null,
            "beforeHelper": null,
            "afterHelper": null,
            "forcedHelper": null,
            "callbackHelper": null,
            "blockModifyHelper": null,
            "shown": false,
            "done": false,
            "message": {
              "html": [
                {
                  "text": "MSG_STEP01",
                  "style": "",
                  "cr": ""
                }
              ]
            }
          },
          {
            "id": "step02",
            "description": "",
            "actionType": "text",
            "initial": false,
            "enabled": false,
            "show_time": 2000,
            "previous": "optin::step01",
            "next": "optin::step03",
            "switchToFunnel": null,
            "beforeHelper": null,
            "afterHelper": null,
            "forcedHelper": null,
            "callbackHelper": null,
            "blockModifyHelper": null,
            "shown": false,
            "done": false,
            "message": {
              "html": [
                {
                  "text": "MSG_STEP02",
                  "style": "b",
                  "cr": ""
                }
              ]
            }
          },
          {
            "id": "step03",
            "description": "",
            "actionType": "text",
            "initial": false,
            "enabled": false,
            "show_time": 5000,
            "previous": "optin::step02",
            "next": "general::step04",
            "switchToFunnel": null,
            "beforeHelper": null,
            "afterHelper": null,
            "forcedHelper": null,
            "callbackHelper": null,
            "blockModifyHelper": null,
            "shown": false,
            "done": false,
            "message": {
              "html": [
                {
                  "text": "MSG_STEP03",
                  "style": "i",
                  "cr": ""
                }
              ]
            }
          },
        ],
        general: [
          {
            "id": "step04",
            "description": "",
            "actionType": "doc",
            "initial": false,
            "enabled": false,
            "show_time": 3000,
            "previous": "optin::step03",
            "next": "general::step05",
            "switchToFunnel": null,
            "beforeHelper": null,
            "afterHelper": null,
            "forcedHelper": null,
            "callbackHelper": null,
            "blockModifyHelper": null,
            "shown": false,
            "done": false,
            "message": {
              "doc": "v1586616265/ABC123.pdf",
              "html": [
                {
                  "text": "MSG_STEP04",
                  "style": "b",
                  "cr": ""
                }
              ]
            }
          },
          {
            "id": "step05",
            "description": "",
            "actionType": "text",
            "initial": false,
            "enabled": false,
            "show_time": 3000,
            "previous": "general::step04",
            "next": null,
            "switchToFunnel": null,
            "beforeHelper": null,
            "afterHelper": null,
            "forcedHelper": null,
            "callbackHelper": null,
            "blockModifyHelper": null,
            "shown": false,
            "done": false,
            "message": {
              "html": [
                {
                  "text": "MSG_STEP05",
                  "style": "",
                  "cr": ""
                }
              ]
            }
          },
        ]
      };
    });

    afterEach(function () {
      client = null;
    });

    it('should fail for wrong funnel name', async function () {

      const funnelName = 'abc';
      const blockId = 'step01';

      const params = {
        client,
        funnelName,
        blockId,
      };

      try {

        await sails.helpers.funnel.proceedNextBlockJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.message).to.include('funnel not found');
        expect(e.raw.payload.error.message).to.include(`funnelName : ${funnelName}`);
      }

    });

    it('should fail for wrong block id', async function () {

      const funnelName = 'optin';
      const blockId = 'step10';

      const params = {
        client,
        funnelName,
        blockId,
      };

      try {

        await sails.helpers.funnel.proceedNextBlockJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.message).to.include('block not found');
        expect(e.raw.payload.error.message).to.include(`blockId : ${blockId}`);
      }

    });

    it('should fail for wrong next funnel name', async function () {

      const funnelName = 'abc';
      const blockId = 'step01';

      const params = {
        client,
        funnelName,
        blockId,
      };

      try {

        await sails.helpers.funnel.proceedNextBlockJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.message).to.include('funnel not found');
        expect(e.raw.payload.error.message).to.include(`funnelName : ${funnelName}`);
      }

    });

    it('should fail for wrong block id', async function () {

      const funnelName = 'optin';
      const blockId = 'step10';

      const params = {
        client,
        funnelName,
        blockId,
      };

      try {

        await sails.helpers.funnel.proceedNextBlockJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.message).to.include('block not found');
        expect(e.raw.payload.error.message).to.include(`blockId : ${blockId}`);
      }

    });

  });

  describe('Perform helper', function () {

    const clientFunnelName = 'test';
    const blockModifyHelperBlock = 'optin';
    const blockModifyHelperName = 'blockModifyHelperJoi';
    const beforeHelperBlock = 'optin';
    const beforeHelperName = 'beforeHelperJoi';
    const afterHelperBlock = 'optin';
    const afterHelperName = 'afterHelperJoi';

    let client;
    let accounts = [];
    let simpleMessageJoiStub;
    let imgMessageJoiStub;
    let videoMessageJoiStub;
    let docMessageJoiStub;
    let forcedMessageJoiStub;
    let inlineKeyboardMessageJoiStub;
    let messageSaveJoiStub;
    let clientUpdateJoiStub;
    let afterHelperGenericJoiStub;
    let blockModifyHelperStub;
    let beforeHelperStub;
    let afterHelperStub;

    beforeEach(async function () {
      client = await clientSdk.generateClient({
        current_funnel: 'optin',
        funnel_name: clientFunnelName,
      });
      client.funnels = {
        optin: [
          {
            "id": "step01",
            "description": "",
            "actionType": "text",
            "initial": true,
            "enabled": true,
            "show_time": 0,
            "previous": null,
            "next": "optin::step02",
            "switchToFunnel": null,
            "beforeHelper": null,
            "afterHelper": null,
            "forcedHelper": null,
            "callbackHelper": null,
            "blockModifyHelper": null,
            "shown": false,
            "done": false,
            "message": {
              "html": [
                {
                  "text": "MSG_STEP01",
                  "style": "",
                  "cr": ""
                }
              ]
            }
          },
          {
            "id": "step02",
            "description": "",
            "actionType": "text",
            "initial": false,
            "enabled": false,
            "show_time": 2000,
            "previous": "optin::step01",
            "next": "optin::step03",
            "switchToFunnel": null,
            "beforeHelper": null,
            "afterHelper": null,
            "forcedHelper": null,
            "callbackHelper": null,
            "blockModifyHelper": null,
            "shown": false,
            "done": false,
            "message": {
              "html": [
                {
                  "text": "MSG_STEP02",
                  "style": "b",
                  "cr": ""
                }
              ]
            }
          },
          {
            "id": "step03",
            "description": "",
            "actionType": "text",
            "initial": false,
            "enabled": false,
            "show_time": 5000,
            "previous": "optin::step02",
            "next": "general::step04",
            "switchToFunnel": null,
            "beforeHelper": null,
            "afterHelper": null,
            "forcedHelper": null,
            "callbackHelper": null,
            "blockModifyHelper": null,
            "shown": false,
            "done": false,
            "message": {
              "html": [
                {
                  "text": "MSG_STEP03",
                  "style": "i",
                  "cr": ""
                }
              ]
            }
          },
        ],
        general: [
          {
            "id": "step04",
            "description": "",
            "actionType": "doc",
            "initial": false,
            "enabled": false,
            "show_time": 3000,
            "previous": "optin::step03",
            "next": "general::step05",
            "switchToFunnel": null,
            "beforeHelper": null,
            "afterHelper": null,
            "forcedHelper": null,
            "callbackHelper": null,
            "blockModifyHelper": null,
            "shown": false,
            "done": false,
            "message": {
              "doc": "v1586616265/ABC123.pdf",
              "html": [
                {
                  "text": "MSG_STEP04",
                  "style": "b",
                  "cr": ""
                }
              ]
            }
          },
          {
            "id": "step05",
            "description": "",
            "actionType": "text",
            "initial": false,
            "enabled": false,
            "show_time": 3000,
            "previous": "general::step04",
            "next": null,
            "switchToFunnel": null,
            "beforeHelper": null,
            "afterHelper": null,
            "forcedHelper": null,
            "callbackHelper": null,
            "blockModifyHelper": null,
            "shown": false,
            "done": false,
            "message": {
              "html": [
                {
                  "text": "MSG_STEP05",
                  "style": "",
                  "cr": ""
                }
              ]
            }
          },
        ]
      };

      for (let i = 1; i <= 3; i++) {
        accounts.push(await accountSdk.generateAccount({
          id: i,
          client: client.id,
        }));
      }

      client.accounts = accounts;
      client.account_use = accounts[0].guid;

      simpleMessageJoiStub = sinon.stub(sails.helpers.mgw[client.messenger], 'simpleMessageJoi');
      imgMessageJoiStub = sinon.stub(sails.helpers.mgw[client.messenger], 'imgMessageJoi');
      videoMessageJoiStub = sinon.stub(sails.helpers.mgw[client.messenger], 'videoMessageJoi');
      docMessageJoiStub = sinon.stub(sails.helpers.mgw[client.messenger], 'docMessageJoi');
      forcedMessageJoiStub = sinon.stub(sails.helpers.mgw[client.messenger], 'forcedMessageJoi');
      inlineKeyboardMessageJoiStub = sinon.stub(sails.helpers.mgw[client.messenger], 'inlineKeyboardMessageJoi');
      messageSaveJoiStub = sinon.stub(sails.helpers.storage, 'messageSaveJoi');
      clientUpdateJoiStub = sinon.stub(sails.helpers.storage, 'clientUpdateJoi');
      afterHelperGenericJoiStub = sinon.stub(sails.helpers.funnel, 'afterHelperGenericJoi');
      blockModifyHelperStub = sinon.stub(sails.helpers.funnel[client.funnel_name][blockModifyHelperBlock], 'blockModifyHelperJoi');
      beforeHelperStub = sinon.stub(sails.helpers.funnel[client.funnel_name][beforeHelperBlock], 'beforeHelperJoi');
      afterHelperStub = sinon.stub(sails.helpers.funnel[client.funnel_name][afterHelperBlock], 'afterHelperJoi');

    });

    afterEach(function () {
      client = null;
      accounts = [];

      simpleMessageJoiStub.restore();
      imgMessageJoiStub.restore();
      videoMessageJoiStub.restore();
      docMessageJoiStub.restore();
      forcedMessageJoiStub.restore();
      inlineKeyboardMessageJoiStub.restore();
      messageSaveJoiStub.restore();
      clientUpdateJoiStub.restore();
      afterHelperGenericJoiStub.restore();
      blockModifyHelperStub.restore();
      beforeHelperStub.restore();
      afterHelperStub.restore();
    });

    it('should perform text message', async function () {

      const funnelName = 'optin';
      const blockId = client.funnels[funnelName][0].id;
      const additionalTokens = [
        {
          token: '$SomeToken$',
          value: 'Text for SomeToken',
        },
      ];

      _.set(sails.config.custom.config, 'lang.ru.token.TEST_ADDITIONAL_TOKENS', 'Here is additionalToken: $SomeToken$');

      client.funnels[funnelName][0].actionType = 'text';
      client.funnels[funnelName][0].enabled = true;
      client.funnels[funnelName][0].done = false;
      client.funnels[funnelName][0].show_time = 0;
      client.funnels[funnelName][0].previous = null;
      client.funnels[funnelName][0].next = null;
      client.funnels[funnelName][0].switchToFunnel = null;
      client.funnels[funnelName][0].beforeHelper = null;
      client.funnels[funnelName][0].afterHelper = null;
      client.funnels[funnelName][0].forcedHelper = null;
      client.funnels[funnelName][0].callbackHelper = null;
      client.funnels[funnelName][0].blockModifyHelper = null;
      client.funnels[funnelName][0].message.html[0].text = 'TEST_ADDITIONAL_TOKENS';

      simpleMessageJoiStub.returns({
        status: 'ok',
        message: 'Telegram simple message was sent',
        payload: {
          message_id: casual.integer(1000, 10000),
        },
      });

      const proceedNextBlockJoiRes = await sails.helpers.funnel.proceedNextBlockJoi({
        client,
        funnelName,
        blockId,
        additionalTokens,
      });

      expect(simpleMessageJoiStub.callCount).to.be.eq(1);
      expect(simpleMessageJoiStub).to.have.been.calledWith({
        chatId: client.chat_id,
        html: 'Here is additionalToken: Text for SomeToken',
      });
      expect(messageSaveJoiStub.callCount).to.be.eq(1);
      expect(clientUpdateJoiStub.callCount).to.be.eq(1);
      expect(afterHelperGenericJoiStub.callCount).to.be.eq(1);
      expect(proceedNextBlockJoiRes).to.deep.include({
        status: 'ok',
        message: 'Success',
        payload: {
          client: client,
          block: client.funnels[funnelName][0],
        }
      });


    });

    it('should perform img message', async function () {

      const funnelName = 'optin';
      const blockId = client.funnels[funnelName][0].id;
      const additionalTokens = [
        {
          token: '$SomeToken$',
          value: 'Text for SomeToken',
        },
      ];
      const imgPath = `${casual.uuid}.jpg`;

      _.set(sails.config.custom.config, 'lang.ru.token.TEST_ADDITIONAL_TOKENS', 'Here is additionalToken: $SomeToken$');

      client.funnels[funnelName][0].actionType = 'img';
      client.funnels[funnelName][0].enabled = true;
      client.funnels[funnelName][0].done = false;
      client.funnels[funnelName][0].show_time = 0;
      client.funnels[funnelName][0].previous = null;
      client.funnels[funnelName][0].next = null;
      client.funnels[funnelName][0].switchToFunnel = null;
      client.funnels[funnelName][0].beforeHelper = null;
      client.funnels[funnelName][0].afterHelper = null;
      client.funnels[funnelName][0].forcedHelper = null;
      client.funnels[funnelName][0].callbackHelper = null;
      client.funnels[funnelName][0].blockModifyHelper = null;
      client.funnels[funnelName][0].message.img = imgPath;
      client.funnels[funnelName][0].message.html[0].text = 'TEST_ADDITIONAL_TOKENS';

      imgMessageJoiStub.returns({
        status: 'ok',
        message: 'Telegram img message was sent',
        payload: {
          message_id: casual.integer(1000, 10000),
        },
      });

      const proceedNextBlockJoiRes = await sails.helpers.funnel.proceedNextBlockJoi({
        client,
        funnelName,
        blockId,
        additionalTokens,
      });

      expect(imgMessageJoiStub.callCount).to.be.eq(1);
      expect(imgMessageJoiStub).to.have.been.calledWith({
        chatId: client.chat_id,
        imgPath: customConfig.mediaUrl + imgPath,
        html: 'Here is additionalToken: Text for SomeToken',
      });
      expect(messageSaveJoiStub.callCount).to.be.eq(1);
      expect(clientUpdateJoiStub.callCount).to.be.eq(1);
      expect(afterHelperGenericJoiStub.callCount).to.be.eq(1);
      expect(proceedNextBlockJoiRes).to.deep.include({
        status: 'ok',
        message: 'Success',
        payload: {
          client: client,
          block: client.funnels[funnelName][0],
        }
      });

    });

    it('should perform video message', async function () {

      const funnelName = 'optin';
      const blockId = client.funnels[funnelName][0].id;
      const additionalTokens = [
        {
          token: '$SomeToken$',
          value: 'Text for SomeToken',
        },
      ];
      const videoPath = `${casual.uuid}.mp4`;

      _.set(sails.config.custom.config, 'lang.ru.token.TEST_ADDITIONAL_TOKENS', 'Here is additionalToken: $SomeToken$');

      client.funnels[funnelName][0].actionType = 'video';
      client.funnels[funnelName][0].enabled = true;
      client.funnels[funnelName][0].done = false;
      client.funnels[funnelName][0].show_time = 0;
      client.funnels[funnelName][0].previous = null;
      client.funnels[funnelName][0].next = null;
      client.funnels[funnelName][0].switchToFunnel = null;
      client.funnels[funnelName][0].beforeHelper = null;
      client.funnels[funnelName][0].afterHelper = null;
      client.funnels[funnelName][0].forcedHelper = null;
      client.funnels[funnelName][0].callbackHelper = null;
      client.funnels[funnelName][0].blockModifyHelper = null;
      client.funnels[funnelName][0].message.video = videoPath;
      client.funnels[funnelName][0].message.html[0].text = 'TEST_ADDITIONAL_TOKENS';

      videoMessageJoiStub.returns({
        status: 'ok',
        message: 'Telegram video message was sent',
        payload: {
          message_id: casual.integer(1000, 10000),
        },
      });

      const proceedNextBlockJoiRes = await sails.helpers.funnel.proceedNextBlockJoi({
        client,
        funnelName,
        blockId,
        additionalTokens,
      });

      expect(videoMessageJoiStub.callCount).to.be.eq(1);
      expect(videoMessageJoiStub).to.have.been.calledWith({
        chatId: client.chat_id,
        videoPath: customConfig.mediaUrl + videoPath,
        html: 'Here is additionalToken: Text for SomeToken',
      });
      expect(messageSaveJoiStub.callCount).to.be.eq(1);
      expect(clientUpdateJoiStub.callCount).to.be.eq(1);
      expect(afterHelperGenericJoiStub.callCount).to.be.eq(1);
      expect(proceedNextBlockJoiRes).to.deep.include({
        status: 'ok',
        message: 'Success',
        payload: {
          client: client,
          block: client.funnels[funnelName][0],
        }
      });

    });

    it('should perform doc message', async function () {

      const funnelName = 'optin';
      const blockId = client.funnels[funnelName][0].id;
      const additionalTokens = [
        {
          token: '$SomeToken$',
          value: 'Text for SomeToken',
        },
      ];
      const docPath = `${casual.uuid}.pdf`;

      _.set(sails.config.custom.config, 'lang.ru.token.TEST_ADDITIONAL_TOKENS', 'Here is additionalToken: $SomeToken$');

      client.funnels[funnelName][0].actionType = 'doc';
      client.funnels[funnelName][0].enabled = true;
      client.funnels[funnelName][0].done = false;
      client.funnels[funnelName][0].show_time = 0;
      client.funnels[funnelName][0].previous = null;
      client.funnels[funnelName][0].next = null;
      client.funnels[funnelName][0].switchToFunnel = null;
      client.funnels[funnelName][0].beforeHelper = null;
      client.funnels[funnelName][0].afterHelper = null;
      client.funnels[funnelName][0].forcedHelper = null;
      client.funnels[funnelName][0].callbackHelper = null;
      client.funnels[funnelName][0].blockModifyHelper = null;
      client.funnels[funnelName][0].message.doc = docPath;
      client.funnels[funnelName][0].message.html[0].text = 'TEST_ADDITIONAL_TOKENS';

      docMessageJoiStub.returns({
        status: 'ok',
        message: 'Telegram doc message was sent',
        payload: {
          message_id: casual.integer(1000, 10000),
        },
      });

      const proceedNextBlockJoiRes = await sails.helpers.funnel.proceedNextBlockJoi({
        client,
        funnelName,
        blockId,
        additionalTokens,
      });

      expect(docMessageJoiStub.callCount).to.be.eq(1);
      expect(docMessageJoiStub).to.have.been.calledWith({
        chatId: client.chat_id,
        docPath: customConfig.mediaUrl + docPath,
        html: 'Here is additionalToken: Text for SomeToken',
      });
      expect(messageSaveJoiStub.callCount).to.be.eq(1);
      expect(clientUpdateJoiStub.callCount).to.be.eq(1);
      expect(afterHelperGenericJoiStub.callCount).to.be.eq(1);
      expect(proceedNextBlockJoiRes).to.deep.include({
        status: 'ok',
        message: 'Success',
        payload: {
          client: client,
          block: client.funnels[funnelName][0],
        }
      });

    });

    it('should perform forced message', async function () {

      const funnelName = 'optin';
      const blockId = client.funnels[funnelName][0].id;
      const additionalTokens = [
        {
          token: '$SomeToken$',
          value: 'Text for SomeToken',
        },
      ];

      _.set(sails.config.custom.config, 'lang.ru.token.TEST_ADDITIONAL_TOKENS', 'Here is additionalToken: $SomeToken$');

      client.funnels[funnelName][0].actionType = 'forced';
      client.funnels[funnelName][0].enabled = true;
      client.funnels[funnelName][0].done = false;
      client.funnels[funnelName][0].show_time = 0;
      client.funnels[funnelName][0].previous = null;
      client.funnels[funnelName][0].next = null;
      client.funnels[funnelName][0].switchToFunnel = null;
      client.funnels[funnelName][0].beforeHelper = null;
      client.funnels[funnelName][0].afterHelper = null;
      client.funnels[funnelName][0].forcedHelper = null;
      client.funnels[funnelName][0].callbackHelper = null;
      client.funnels[funnelName][0].blockModifyHelper = null;
      client.funnels[funnelName][0].message.html[0].text = 'TEST_ADDITIONAL_TOKENS';

      forcedMessageJoiStub.returns({
        status: 'ok',
        message: 'Telegram forced message was sent',
        payload: {
          message_id: casual.integer(1000, 10000),
        },
      });

      const proceedNextBlockJoiRes = await sails.helpers.funnel.proceedNextBlockJoi({
        client,
        funnelName,
        blockId,
        additionalTokens,
      });

      expect(forcedMessageJoiStub.callCount).to.be.eq(1);
      expect(forcedMessageJoiStub).to.have.been.calledWith({
        chatId: client.chat_id,
        html: 'Here is additionalToken: Text for SomeToken',
      });
      expect(messageSaveJoiStub.callCount).to.be.eq(1);
      expect(clientUpdateJoiStub.callCount).to.be.eq(1);
      expect(afterHelperGenericJoiStub.callCount).to.be.eq(0);
      expect(proceedNextBlockJoiRes).to.deep.include({
        status: 'ok',
        message: 'Success',
        payload: {
          client: client,
          block: client.funnels[funnelName][0],
        }
      });

    });

    it('should perform inline_keyboard message', async function () {

      const funnelName = 'optin';
      const blockId = client.funnels[funnelName][0].id;
      const additionalTokens = [
        {
          token: '$SomeToken$',
          value: 'Text for SomeToken',
        },
      ];

      _.set(sails.config.custom.config, 'lang.ru.token.TEST_ADDITIONAL_TOKENS', 'Here is additionalToken: $SomeToken$');
      _.set(sails.config.custom.config, 'lang.ru.token.TEST_INLINE_ONE', 'Inline keyboard text');

      client.funnels[funnelName][0].actionType = 'inline_keyboard';
      client.funnels[funnelName][0].enabled = true;
      client.funnels[funnelName][0].done = false;
      client.funnels[funnelName][0].show_time = 0;
      client.funnels[funnelName][0].previous = null;
      client.funnels[funnelName][0].next = null;
      client.funnels[funnelName][0].switchToFunnel = null;
      client.funnels[funnelName][0].beforeHelper = null;
      client.funnels[funnelName][0].afterHelper = null;
      client.funnels[funnelName][0].forcedHelper = null;
      client.funnels[funnelName][0].callbackHelper = null;
      client.funnels[funnelName][0].blockModifyHelper = null;
      client.funnels[funnelName][0].message.html[0].text = 'TEST_ADDITIONAL_TOKENS';
      client.funnels[funnelName][0].message.inline_keyboard = [
        [
          {
            "text": "TEST_INLINE_ONE",
            "callback_data": "inline_one"
          }
        ]
      ];

      inlineKeyboardMessageJoiStub.returns({
        status: 'ok',
        message: 'Telegram inline keyboard message was sent',
        payload: {
          message_id: casual.integer(1000, 10000),
        },
      });

      const proceedNextBlockJoiRes = await sails.helpers.funnel.proceedNextBlockJoi({
        client,
        funnelName,
        blockId,
        additionalTokens,
      });

      expect(inlineKeyboardMessageJoiStub.callCount).to.be.eq(1);
      expect(inlineKeyboardMessageJoiStub).to.have.been.calledWith({
        chatId: client.chat_id,
        html: 'Here is additionalToken: Text for SomeToken',
        inlineKeyboard: [
          [
            {
              "text": "Inline keyboard text",
              "callback_data": "inline_one"
            }
          ]
        ],
      });
      expect(messageSaveJoiStub.callCount).to.be.eq(1);
      expect(clientUpdateJoiStub.callCount).to.be.eq(1);
      expect(afterHelperGenericJoiStub.callCount).to.be.eq(0);
      expect(proceedNextBlockJoiRes).to.deep.include({
        status: 'ok',
        message: 'Success',
        payload: {
          client: client,
          block: client.funnels[funnelName][0],
        }
      });

    });

    it('should perform blockModifyHelper', async function () {

      const funnelName = 'optin';
      const block = client.funnels[funnelName][0];
      const blockId = block.id;
      const additionalTokens = [
        {
          token: '$SomeToken$',
          value: 'Text for SomeToken',
        },
      ];

      _.set(sails.config.custom.config, 'lang.ru.token.TEST_ADDITIONAL_TOKENS', 'Here is additionalToken: $SomeToken$');

      block.actionType = 'text';
      block.enabled = true;
      block.done = false;
      block.show_time = 0;
      block.previous = null;
      block.next = null;
      block.switchToFunnel = null;
      block.beforeHelper = null;
      block.afterHelper = null;
      block.forcedHelper = null;
      block.callbackHelper = null;
      block.blockModifyHelper = `${blockModifyHelperBlock}::${blockModifyHelperName}`;
      block.message.html[0].text = 'TEST_ADDITIONAL_TOKENS';

      simpleMessageJoiStub.returns({
        status: 'ok',
        message: 'Telegram simple message was sent',
        payload: {
          message_id: casual.integer(1000, 10000),
        },
      });

      blockModifyHelperStub.returns(block);

      const proceedNextBlockJoiRes = await sails.helpers.funnel.proceedNextBlockJoi({
        client,
        funnelName,
        blockId,
        additionalTokens,
      });

      expect(blockModifyHelperStub.callCount).to.be.eq(1);
      expect(blockModifyHelperStub).to.have.been.calledWith({
        client,
        block,
      });
      expect(simpleMessageJoiStub.callCount).to.be.eq(1);
      expect(simpleMessageJoiStub).to.have.been.calledWith({
        chatId: client.chat_id,
        html: 'Here is additionalToken: Text for SomeToken',
      });
      expect(messageSaveJoiStub.callCount).to.be.eq(1);
      expect(clientUpdateJoiStub.callCount).to.be.eq(1);
      expect(afterHelperGenericJoiStub.callCount).to.be.eq(1);
      expect(proceedNextBlockJoiRes).to.deep.include({
        status: 'ok',
        message: 'Success',
        payload: {
          client,
          block,
        }
      });


    });

    it('should perform beforeHelper', async function () {

      const funnelName = 'optin';
      const block = client.funnels[funnelName][0];
      const blockId = block.id;
      const additionalTokens = [
        {
          token: '$SomeToken$',
          value: 'Text for SomeToken',
        },
      ];

      _.set(sails.config.custom.config, 'lang.ru.token.TEST_ADDITIONAL_TOKENS', 'Here is additionalToken: $SomeToken$');

      block.actionType = 'text';
      block.enabled = true;
      block.done = false;
      block.show_time = 0;
      block.previous = null;
      block.next = null;
      block.switchToFunnel = null;
      block.beforeHelper = `${beforeHelperBlock}::${beforeHelperName}`;
      block.afterHelper = null;
      block.forcedHelper = null;
      block.callbackHelper = null;
      block.blockModifyHelper = null;
      block.message.html[0].text = 'TEST_ADDITIONAL_TOKENS';

      simpleMessageJoiStub.returns({
        status: 'ok',
        message: 'Telegram simple message was sent',
        payload: {
          message_id: casual.integer(1000, 10000),
        },
      });

      const beforeHelperStubRes = {
        text: 'Here is additionalToken: Text for SomeToken',
        inline_keyboard: null,
      };

      beforeHelperStub.returns(beforeHelperStubRes);

      const proceedNextBlockJoiRes = await sails.helpers.funnel.proceedNextBlockJoi({
        client,
        funnelName,
        blockId,
        additionalTokens,
      });

      expect(beforeHelperStub.callCount).to.be.eq(1);
      expect(beforeHelperStub).to.have.been.calledWith({
        client,
        block,
        payload: beforeHelperStubRes,
      });
      expect(simpleMessageJoiStub.callCount).to.be.eq(1);
      expect(simpleMessageJoiStub).to.have.been.calledWith({
        chatId: client.chat_id,
        html: 'Here is additionalToken: Text for SomeToken',
      });
      expect(messageSaveJoiStub.callCount).to.be.eq(1);
      expect(clientUpdateJoiStub.callCount).to.be.eq(1);
      expect(afterHelperGenericJoiStub.callCount).to.be.eq(1);
      expect(proceedNextBlockJoiRes).to.deep.include({
        status: 'ok',
        message: 'Success',
        payload: {
          client,
          block,
        }
      });


    });

    it('should perform afterHelper', async function () {

      const funnelName = 'optin';
      const block = client.funnels[funnelName][0];
      const blockId = block.id;
      const additionalTokens = [
        {
          token: '$SomeToken$',
          value: 'Text for SomeToken',
        },
      ];

      _.set(sails.config.custom.config, 'lang.ru.token.TEST_ADDITIONAL_TOKENS', 'Here is additionalToken: $SomeToken$');

      block.actionType = 'text';
      block.enabled = true;
      block.done = false;
      block.show_time = 0;
      block.previous = null;
      block.next = null;
      block.switchToFunnel = null;
      block.beforeHelper = null;
      block.afterHelper = `${afterHelperBlock}::${afterHelperName}`;
      block.forcedHelper = null;
      block.callbackHelper = null;
      block.blockModifyHelper = null;
      block.message.html[0].text = 'TEST_ADDITIONAL_TOKENS';

      simpleMessageJoiStub.returns({
        status: 'ok',
        message: 'Telegram simple message was sent',
        payload: {
          message_id: casual.integer(1000, 10000),
        },
      });

      const proceedNextBlockJoiRes = await sails.helpers.funnel.proceedNextBlockJoi({
        client,
        funnelName,
        blockId,
        additionalTokens,
      });

      expect(afterHelperStub.callCount).to.be.eq(1);
      expect(afterHelperStub).to.have.been.calledWith({
        client,
        block,
      });
      expect(simpleMessageJoiStub.callCount).to.be.eq(1);
      expect(simpleMessageJoiStub).to.have.been.calledWith({
        chatId: client.chat_id,
        html: 'Here is additionalToken: Text for SomeToken',
      });
      expect(messageSaveJoiStub.callCount).to.be.eq(1);
      expect(clientUpdateJoiStub.callCount).to.be.eq(1);
      expect(afterHelperGenericJoiStub.callCount).to.be.eq(0);
      expect(proceedNextBlockJoiRes).to.deep.include({
        status: 'ok',
        message: 'Success',
        payload: {
          client,
          block,
        }
      });


    });

  });

});


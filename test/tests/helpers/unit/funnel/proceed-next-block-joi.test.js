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

    let client;
    let accounts = [];
    let simpleMessageJoiStub;
    let messageSaveJoiStub;
    let clientUpdateJoiStub;
    let afterHelperGenericJoiStub;

    beforeEach(async function () {
      client = await clientSdk.generateClient({current_funnel: 'optin'});
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
      messageSaveJoiStub = sinon.stub(sails.helpers.storage, 'messageSaveJoi');
      clientUpdateJoiStub = sinon.stub(sails.helpers.storage, 'clientUpdateJoi');
      afterHelperGenericJoiStub = sinon.stub(sails.helpers.funnel, 'afterHelperGenericJoi');

    });

    afterEach(function () {
      client = null;
      accounts = [];

      simpleMessageJoiStub.restore();
      messageSaveJoiStub.restore();
      clientUpdateJoiStub.restore();
      afterHelperGenericJoiStub.restore();
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

  });

});


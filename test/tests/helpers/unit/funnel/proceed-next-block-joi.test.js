"use strict";

const {expect} = require('chai');
const sinon = require('sinon');
const mlog = require('mocha-logger');
const casual = require('casual');
const clientSdk = require('../../../../sdk/client');
const messagesSdk = require('../../../../sdk/messages');
const pushMessagesSdk = require('../../../../sdk/pushMessages');

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

});


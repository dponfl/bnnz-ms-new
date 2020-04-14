"use strict";

const {expect} = require('chai');
const sinon = require('sinon');
const mlog = require('mocha-logger');
const casual = require('casual');
const clientSdk = require('../../../../sdk/client');

describe.only('funnel.afterHelperGenericJoi test', function () {

  let customConfig, customConfigGeneral;

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;
    customConfigGeneral = customConfig.config.general;
  });

  describe('Check input params', function () {

    it ('should fail for missing "client" param', async () => {

      try {

        const block = {
          key: 'value',
        };
        const next = casual.boolean;
        const previous = casual.boolean;
        const switchFunnel = casual.boolean;

        const params = {
          block,
          next,
          previous,
          switchFunnel,
        };

        await sails.helpers.funnel.afterHelperGenericJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.deep.include({message: '"client" is required'});
      }

    });

    it ('should fail for missing "block" param', async () => {

      try {

        const client = await clientSdk.generateClient();
        const next = casual.boolean;
        const previous = casual.boolean;
        const switchFunnel = casual.boolean;

        const params = {
          client,
          next,
          previous,
          switchFunnel,
        };

        await sails.helpers.funnel.afterHelperGenericJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.deep.include({message: '"block" is required'});
      }

    });

    it ('should fail for missing "next" param', async () => {

      try {

        const client = await clientSdk.generateClient();
        const block = {
          key: 'value',
        };
        const previous = casual.boolean;
        const switchFunnel = casual.boolean;

        const params = {
          client,
          block,
          previous,
          switchFunnel,
        };

        await sails.helpers.funnel.afterHelperGenericJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.deep.include({message: '"next" is required'});
      }

    });

    it ('should fail for missing "previous" param', async () => {

      try {

        const client = await clientSdk.generateClient();
        const block = {
          key: 'value',
        };
        const next = casual.boolean;
        const switchFunnel = casual.boolean;

        const params = {
          client,
          block,
          next,
          switchFunnel,
        };

        await sails.helpers.funnel.afterHelperGenericJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.deep.include({message: '"previous" is required'});
      }

    });

    it ('should fail for missing "switchFunnel" param', async () => {

      try {

        const client = await clientSdk.generateClient();
        const block = {
          key: 'value',
        };
        const next = casual.boolean;
        const previous = casual.boolean;

        const params = {
          client,
          block,
          next,
          previous,
        };

        await sails.helpers.funnel.afterHelperGenericJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.deep.include({message: '"switchFunnel" is required'});
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

    it('should fail for wrong next funnel name', async function () {

      const funnel = 'optin';
      const blockId = 'step02';
      const block = _.find(client.funnels[funnel], {id: blockId});
      if (_.isNil(block)) {
        expect.fail(`funnel block for id: ${blockId} not found`);
      }
      const nextFunnel = 'abc';
      block.next = `${nextFunnel}::step03`;
      const next = true;
      const previous = false;
      const switchFunnel = false;

      const params = {
        client,
        block,
        next,
        previous,
        switchFunnel,
      };

      try {

        await sails.helpers.funnel.afterHelperGenericJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.message).to.include('funnel not found');
        expect(e.raw.payload.error.message).to.include(`nextFunnel : ${nextFunnel}`);
      }

    });

    it('should fail for wrong next blockId name', async function () {

      const funnel = 'optin';
      const blockId = 'step02';
      const block = _.find(client.funnels[funnel], {id: blockId});
      if (_.isNil(block)) {
        expect.fail(`funnel block for id: ${blockId} not found`);
      }
      const nextId = 'abc';
      block.next = `optin::${nextId}`;
      const next = true;
      const previous = false;
      const switchFunnel = false;

      const params = {
        client,
        block,
        next,
        previous,
        switchFunnel,
      };

      try {

        await sails.helpers.funnel.afterHelperGenericJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.message).to.include('nextBlock not found');
        expect(e.raw.payload.error.message).to.include(`nextId : ${nextId}`);
      }

    });

  });

  // describe('Check helper call', function () {
  //
  //   beforeEach(function () {
  //
  //   });
  //
  //   afterEach(function () {
  //
  //   });
  //
  // });

});


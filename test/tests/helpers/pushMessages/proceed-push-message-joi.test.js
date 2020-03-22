"use strict";

const {expect} = require('chai');
const sinon = require('sinon');
const mlog = require('mocha-logger');
const casual = require('casual');
const clientSdk = require('../../../sdk/client.js');
const messagesSdk = require('../../../sdk/messages.js');

describe('pushMessages.proceedPushMessageJoi test', function () {

  let config, pushMessages;

  before(async function () {
    const configRaw =   await sails.helpers.general.getConfig();
    config = configRaw.payload;
    pushMessages = config.pushMessages;
  });


  afterEach(async function () {
    config.pushMessages = pushMessages;
    await sails.helpers.general.setConfig(config);
  });

  describe('Check input params', function () {

    it ('should fail for missing "client" param', async () => {

      const query = {
        id: casual.uuid,
        data: `push_msg_tsk_l_${casual.uuid}`,
        message: await messagesSdk.generateMessage(),
      };

      try {

        const params = {
          query: query,
          group: pushMessages.tasks.likes.messages,
          startBlockName: 'start',
        };

        await sails.helpers.pushMessages.proceedPushMessageJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"client" is required');
      }

    });

    it ('should fail for missing "query" param', async () => {

      const client = await clientSdk.generateClient();

      try {

        const params = {
          client: client,
          group: pushMessages.tasks.likes.messages,
          startBlockName: 'start',
        };

        await sails.helpers.pushMessages.proceedPushMessageJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"query" is required');
      }

    });

    it ('should fail for missing "group" param', async () => {

      const client = await clientSdk.generateClient();
      const query = {
        id: casual.uuid,
        data: `push_msg_tsk_l_${casual.uuid}`,
        message: await messagesSdk.generateMessage(),
      };

      try {

        const params = {
          client: client,
          query: query,
          startBlockName: 'start',
        };

        await sails.helpers.pushMessages.proceedPushMessageJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"group" is required');
      }

    });

    it ('should fail for missing "startBlockName" param', async () => {

      const client = await clientSdk.generateClient();
      const query = {
        id: casual.uuid,
        data: `push_msg_tsk_l_${casual.uuid}`,
        message: await messagesSdk.generateMessage(),
      };

      try {

        const params = {
          client: client,
          query: query,
          group: pushMessages.tasks.likes.messages,
        };

        await sails.helpers.pushMessages.proceedPushMessageJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"startBlockName" is required');
      }

    });

  });

  describe('Wrong config', function () {

    it('should throw error for missing initial block', async function () {

      const client = await clientSdk.generateClient();
      const query = {
        id: casual.uuid,
        data: `push_msg_tsk_l_${casual.uuid}`,
        message: await messagesSdk.generateMessage(),
      };
      const params = {
        client: client,
        query: query,
        group: pushMessages.tasks.likes.messages,
        startBlockName: 'some',
      };

      try {

        await sails.helpers.pushMessages.proceedPushMessageJoi(params);
        expect.fails('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.be.an.instanceof(Error);
        expect(e.raw.payload.error).to.has.property('message');
        expect(e.raw.payload.error.message).to.include(`critical error: initial block with id=${params.startBlockName} not found in the group`);
      }

    });

    it('should throw error for wrong format of callbackHelper', async function () {

      const group = [
        {
          "id": "start",
          "description": "Задача поставить лайк",
          "actionType": "inline_keyboard",
          "initial": true,
          "enabled": true,
          "previous": null,
          "show_time": "now",
          "next": null,
          "shown": false,
          "beforeHelper": null,
          "afterHelper": null,
          "forcedHelper": null,
          "callbackHelper": "tasks:callbackLikes",
          "blockModifyHelper": "tasks::blockModifyLikes",
          "message": {
            "html": [
              {
                "text": "MSG_TASK_LIKE",
                "style": "",
                "cr": "SCR"
              },
              {
                "text": "MSG_TASK_POST_LINK",
                "style": "b",
                "cr": "DCR"
              },
              {
                "text": "MSG_TASK",
                "style": "bi",
                "cr": ""
              }
            ],
            "inline_keyboard": [
            ]
          }
        }
      ];

      const client = await clientSdk.generateClient();
      const query = {
        id: casual.uuid,
        data: `push_msg_tsk_l_${casual.uuid}`,
        message: await messagesSdk.generateMessage(),
      };

      try {

        const params = {
          client: client,
          query: query,
          group: group,
          startBlockName: 'start',
        };

        await sails.helpers.pushMessages.proceedPushMessageJoi(params);

        expect.fails('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.be.an.instanceof(Error);
        expect(e.raw.payload.error).to.has.property('message');
        expect(e.raw.payload.error.message).to.include(`critical error: could not parse callback helper name`);
      }

    });

  });

  describe.skip('Check pushMessages.tasks.likes.messages[0].callbackHelper call', function () {

    let config, pushMessages;

    before(async function () {
      const configRaw =   await sails.helpers.general.getConfig();
      config = configRaw.payload;
      pushMessages = config.pushMessages;
    });

    afterEach(async function () {
      config.pushMessages = pushMessages;
      const configUpdatedRaw = await sails.helpers.general.setConfig(config);
    });


    it('should successfully call pushMessages.tasks.likes.messages[0].callbackHelper', async function () {

      let callbackHelperStub;

      const client = await clientSdk.generateClient();
      const query = {
        id: casual.uuid,
        data: `push_msg_tsk_l_${casual.uuid}`,
        message: await messagesSdk.generateMessage(),
      };

      try {

        let splitCallbackHelperRes = _.split(pushMessages.tasks.likes.messages[0].callbackHelper, sails.config.custom.JUNCTION, 2);
        let callbackHelperBlock = splitCallbackHelperRes[0];
        let callbackHelperName = splitCallbackHelperRes[1];

        if (callbackHelperBlock && callbackHelperName) {

          callbackHelperStub = sinon.stub(sails.helpers.pushMessages[callbackHelperBlock], callbackHelperName);

          await sails.helpers.pushMessages.supervisorCallbackJoi({
            client: client,
            query: query,
          });

          expect(callbackHelperStub.callCount).to.be.eq(1);

        } else {
          expect.fail(`could not parse callback helper name from: ${pushMessages.tasks.likes.messages[0].callbackHelper}`);
        }

      } catch (e) {
        expect.fail(`Unexpected error: ${JSON.stringify(e, null, 3)}`);
      }

    });

  });



});

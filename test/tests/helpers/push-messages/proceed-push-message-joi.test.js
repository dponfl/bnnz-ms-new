"use strict";

const {expect} = require('chai');
const sinon = require('sinon');
const mlog = require('mocha-logger');
const casual = require('casual');
const clientSdk = require('../../../sdk/client');
const messagesSdk = require('../../../sdk/messages');
const pushMessagesSdk = require('../../../sdk/pushMessages');

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

        const messageData = await pushMessagesSdk.generateMessageData('likes');
        const params = {
          query,
          messageData,
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

        const messageData = await pushMessagesSdk.generateMessageData('likes');
        const params = {
          client,
          messageData,
        };

        await sails.helpers.pushMessages.proceedPushMessageJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"query" is required');
      }

    });

    it ('should fail for missing "messageData" param', async () => {

      const client = await clientSdk.generateClient();
      const query = {
        id: casual.uuid,
        data: `push_msg_tsk_l_${casual.uuid}`,
        message: await messagesSdk.generateMessage(),
      };

      try {

        const params = {
          client,
          query,
        };

        await sails.helpers.pushMessages.proceedPushMessageJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"messageData" is required');
      }

    });

  });

  describe('Wrong config', function () {

    it('should throw error for wrong format of callbackHelper', async function () {

      const client = await clientSdk.generateClient();
      const query = {
        id: casual.uuid,
        data: `push_msg_tsk_l_${casual.uuid}`,
        message: await messagesSdk.generateMessage(),
      };

      try {

        const messageData = await pushMessagesSdk.generateMessageData('likes', {
          callbackHelper: "tasks:callbackLikes",
        });
        const params = {
          client,
          query,
          messageData,
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

  describe('Check callbackHelper call', function () {

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


    it('should successfully call callbackHelper', async function () {

      let callbackHelperStub;

      const client = await clientSdk.generateClient();
      const query = {
        id: casual.uuid,
        data: `push_msg_tsk_l_${casual.uuid}`,
        message: await messagesSdk.generateMessage(),
      };
      const messageData = await pushMessagesSdk.generateMessageData('likes');
      const params = {
        client,
        query,
        messageData,
      };

      try {

        let splitCallbackHelperRes = _.split(messageData.callbackHelper, sails.config.custom.JUNCTION, 2);
        let callbackHelperBlock = splitCallbackHelperRes[0];
        let callbackHelperName = splitCallbackHelperRes[1];

        if (callbackHelperBlock && callbackHelperName) {

          callbackHelperStub = sinon.stub(sails.helpers.pushMessages[callbackHelperBlock], callbackHelperName);
          // callbackHelperStub = sinon.stub(sails.helpers.pushMessages[callbackHelperBlock], callbackHelperName);

          const proceedPushMessageJoiRes = await sails.helpers.pushMessages.proceedPushMessageJoi(params);

          expect(callbackHelperStub.callCount).to.be.eq(1);
          expect(proceedPushMessageJoiRes).to.have.property('status', 'ok');
          expect(proceedPushMessageJoiRes).to.have.property('message', 'proceedPushMessageJoi performed');

        } else {
          expect.fail(`could not parse callback helper name from: ${pushMessages.tasks.likes.messages[0].callbackHelper}`);
        }

      } catch (e) {
        expect.fail(`Unexpected error: ${JSON.stringify(e, null, 3)}`);
      }

    });

  });



});

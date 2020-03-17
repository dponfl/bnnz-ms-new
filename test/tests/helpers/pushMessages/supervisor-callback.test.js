"use strict";

const {expect} = require('chai');
const sinon = require('sinon');
const mlog = require('mocha-logger');
const casual = require('casual');
const clientSdk = require('../../../sdk/client.js');
const messagesSdk = require('../../../sdk/messages.js');

describe('pushMessages.supervisorCallback test', function () {

  let messageSaveJoiStub;

  beforeEach(function () {
    messageSaveJoiStub = sinon.stub(sails.helpers.storage, 'messageSaveJoi');
  });

  afterEach(function () {
    messageSaveJoiStub.restore();
  });

  describe('Callback prefix analysis', function () {

    it('should throw error for unknown callback prefix', async function () {

      const client = await clientSdk.generateClient();
      const query = {
        id: casual.uuid,
        data: `push_msg_ttt_${casual.uuid}`,
        message: await messagesSdk.generateMessage(),
      };

      try {

        await sails.helpers.pushMessages.supervisorCallbackJoi({
          client: client,
          query: query,
        });

        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.be.an.instanceof(Error);
        expect(e.raw.payload.error).to.has.property('message');
        expect(e.raw.payload.error.message).to.include(`unknown callback prefix, query.data: ${query.data}`);
      }

    });

    it('should throw error for unknown task type', async function () {

      const client = await clientSdk.generateClient();
      const query = {
        id: casual.uuid,
        data: `push_msg_tsk_ttt_${casual.uuid}`,
        message: await messagesSdk.generateMessage(),
      };

      try {

        await sails.helpers.pushMessages.supervisorCallbackJoi({
          client: client,
          query: query,
        });

        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.be.an.instanceof(Error);
        expect(e.raw.payload.error).to.has.property('message');
        expect(e.raw.payload.error.message).to.include(`unknown task category, query.data: ${query.data}`);
      }

    });

  });

  describe('Wrong config for tasks.likes', function () {

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

    it('should throw error for missing config for tasks.likes', async function () {

      config = _.omit(config, 'pushMessages.tasks.likes');
      await sails.helpers.general.setConfig(config);

      const client = await clientSdk.generateClient();
      const query = {
        id: casual.uuid,
        data: `push_msg_tsk_l_${casual.uuid}`,
        message: await messagesSdk.generateMessage(),
      };

      try {

        await sails.helpers.pushMessages.supervisorCallbackJoi({
          client: client,
          query: query,
        });

        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.be.an.instanceof(Error);
        expect(e.raw.payload.error).to.has.property('message');
        expect(e.raw.payload.error.message).to.include(`critical error: push messages config has no tasks.likes property`);
      }

    });

    it('should throw error for missing config for tasks.likes.messages', async function () {

      config = _.omit(config, 'pushMessages.tasks.likes.messages');
      await sails.helpers.general.setConfig(config);

      const client = await clientSdk.generateClient();
      const query = {
        id: casual.uuid,
        data: `push_msg_tsk_l_${casual.uuid}`,
        message: await messagesSdk.generateMessage(),
      };

      try {

        await sails.helpers.pushMessages.supervisorCallbackJoi({
          client: client,
          query: query,
        });

        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.be.an.instanceof(Error);
        expect(e.raw.payload.error).to.has.property('message');
        expect(e.raw.payload.error.message).to.include(`critical error: push messages config has no tasks.likes.messages property`);
      }

    });

    it('should throw error for missing tasks.likes.messages[0].callbackHelper', async function () {

      config.pushMessages.tasks.likes.messages[0].callbackHelper = null;
      await sails.helpers.general.setConfig(config);

      const client = await clientSdk.generateClient();
      const query = {
        id: casual.uuid,
        data: `push_msg_tsk_l_${casual.uuid}`,
        message: await messagesSdk.generateMessage(),
      };

      try {

        await sails.helpers.pushMessages.supervisorCallbackJoi({
          client: client,
          query: query,
        });

        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.be.an.instanceof(Error);
        expect(e.raw.payload.error).to.has.property('message');
        expect(e.raw.payload.error.message).to.include(`critical error: push messages config tasks.likes has no callbackHelper`);
      }

    });

    it('should throw error for wrong format of tasks.likes.messages[0].callbackHelper', async function () {

      config.pushMessages.tasks.likes.messages[0].callbackHelper = "tasks:callbackLikes";
      await sails.helpers.general.setConfig(config);

      const client = await clientSdk.generateClient();
      const query = {
        id: casual.uuid,
        data: `push_msg_tsk_l_${casual.uuid}`,
        message: await messagesSdk.generateMessage(),
      };

      try {

        await sails.helpers.pushMessages.supervisorCallbackJoi({
          client: client,
          query: query,
        });

        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.be.an.instanceof(Error);
        expect(e.raw.payload.error).to.has.property('message');
        expect(e.raw.payload.error.message).to.include(`critical error: could not parse callback helper name`);
      }

    });

  });

  describe('Check pushMessages.tasks.likes.messages[0].callbackHelper call', function () {

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

          expect(callbackHelperStub.calledOnce).to.be.true;

        } else {
          expect.fail(`could not parse callback helper name from: ${pushMessages.tasks.likes.messages[0].callbackHelper}`);
        }

      } catch (e) {
        expect.fail(`Unexpected error: ${JSON.stringify(e, null, 3)}`);
      }

    });

  });

});

"use strict";

const {expect} = require('chai');
const sinon = require('sinon');
const mlog = require('mocha-logger');
const casual = require('casual');

const clientSdk = require('../../../sdk/client.js');
const accountSdk = require('../../../sdk/account.js');
const roomSdk = require('../../../sdk/room');

describe('tasks.generateTasksJoi test', function () {

  describe('Joi validation check', function () {

    let customConfig, customConfigGeneral;

    before(async function () {
      const customConfigRaw =   await sails.helpers.general.getConfig();
      customConfig = customConfigRaw.payload;
      customConfigGeneral = customConfig.config.general;
    });

    afterEach(async function () {
      customConfig.config.general = customConfigGeneral;
      const customConfigUpdatedRaw = await sails.helpers.general.setConfig(customConfig);
    });

    it('should throw error on missing client key', async function () {

      try {

        await sails.helpers.tasks.generateTasksJoi({
          postLink: sails.config.custom.config.general.instagram_post_prefix + casual.uuid,
        });

        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"client" is required');
      }

    });

    it('should throw error on missing postLink key', async function () {

      const client = await clientSdk.generateClient();

      try {

        await sails.helpers.tasks.generateTasksJoi({
          client,
        });

        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"postLink" is required');
      }

    });

    it('should throw error on wrong postLink value', async function () {

      const client = clientSdk.generateClient();
      const postLink = 'https://www.instagram.dom/' + casual.uuid;

      try {

        await sails.helpers.tasks.generateTasksJoi({
          client,
          postLink,
        });

        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0])
          .to.have.property('message')
          .to.include(`"postLink" with value "${postLink}" fails to match the required pattern`);
      }

    });

  });

  describe('Perform account checks', function () {

    let customConfig;
    let client;
    let accounts = [];
    let postLink;

    beforeEach(async function () {

      const customConfigRaw = await sails.helpers.general.getConfig();
      customConfig = customConfigRaw.payload;

      client = await clientSdk.generateClient();

      for (let i = 1; i <= 3; i++) {
        accounts.push(await accountSdk.generateAccount({
          id: i,
          client: client.id,
        }));
      }

      client.accounts = accounts;
      client.account_use = accounts[0].guid;

      postLink = customConfig.config.general.instagram_post_prefix + casual.uuid;

    });

    afterEach(function () {

      client = null;
      accounts = [];

    });

    it('should throw error on getting wrong account in use from client record', async function () {

      try {

        client.account_use = casual.uuid;

        await sails.helpers.tasks.generateTasksJoi({
          client,
          postLink,
        });
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.be.an.instanceof(Error);
        expect(e.raw.payload.error).to.has.property('message');
        expect(e.raw.payload.error.message).to.include(`error: Cannot get account in use from client record`);
      }

    });

    it('should throw error on account with no active subscription', async function () {

      try {

        accounts[0].subscription_active = false;

        await sails.helpers.tasks.generateTasksJoi({
          client,
          postLink,
        });
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.be.an.instanceof(Error);
        expect(e.raw.payload.error).to.has.property('message');
        expect(e.raw.payload.error.message).to.include(`error: Account has not active subscription`);
      }

    });

    it('should throw error on max daily posts reached', async function () {

      try {

        client.accounts[0].posts_made_day = client.accounts[0].service.max_outgoing_posts_day;

        await sails.helpers.tasks.generateTasksJoi({
          client,
          postLink,
        });
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.be.an.instanceof(Error);
        expect(e.raw.payload.error).to.has.property('message');
        expect(e.raw.payload.error.message).to.include(`error: Max amount of outgoing posts reached`);
      }

    });

  });

  describe('tasks generation', function () {

    let customConfig;
    let client;
    let clients = [];
    let account;
    let accounts = [];
    let postLink;

    let postsCreateJoiStub;
    let getAccountsByRoomsStub;
    let tasksCreateJoiStub;
    let postsUpdateJoiStub;
    let sendMessageJoiStub;
    let accountUpdateJoiStub;

    before(function () {
      postsCreateJoiStub = sinon.stub(sails.helpers.storage, 'postsCreateJoi');
      getAccountsByRoomsStub = sinon.stub(sails.helpers.storage, 'getAccountsByRooms');
      tasksCreateJoiStub = sinon.stub(sails.helpers.storage, 'tasksCreateJoi');
      postsUpdateJoiStub = sinon.stub(sails.helpers.storage, 'postsUpdateJoi');
      sendMessageJoiStub = sinon.stub(sails.helpers.messageProcessor, 'sendMessageJoi');
      accountUpdateJoiStub = sinon.stub(sails.helpers.storage, 'accountUpdateJoi');
    });

    after(function () {
      postsCreateJoiStub.reset();
      getAccountsByRoomsStub.reset();
      tasksCreateJoiStub.reset();
      postsUpdateJoiStub.reset();
      accountUpdateJoiStub.reset();
    });

    beforeEach(async function () {

      const customConfigRaw = await sails.helpers.general.getConfig();
      customConfig = customConfigRaw.payload;

      /**
       * Generate set of data for the client/account who puts post
       */

      client = await clientSdk.generateClient({id: 100, accounts: []});

      let rooms = [];

      for (let j = 1; j <= 3; j++) {

        /**
         * Generate 3 rooms for each account
         */

        rooms.push(await roomSdk.generateRoom({id: j, name: j}))
      }

      account = await accountSdk.generateAccount({
        id: 100,
        client: client.id,
        room: rooms,
      });

      client.accounts.push(account);
      client.account_use = account.guid;

      postLink = customConfig.config.general.instagram_post_prefix + casual.uuid;

      /**
       * Generate set of data for 3 more clients/accounts to whom tasks to be sent
       */

      for (let i = 1; i <= 3; i++) {

        clients.push(await clientSdk.generateClient({id: i, accounts: []}));

        let rooms = [];

        for (let j = 1; j <= 3; j++) {

          /**
           * Generate 3 rooms for each account
           */

          rooms.push(await roomSdk.generateRoom({id: j, name: j}));
        }

        accounts.push(await accountSdk.generateAccount({
          id: i,
          client: clients[i-1].id,
          room: rooms,
        }));

        clients[i-1].accounts.push(accounts[i-1]);
        clients[i-1].account_use = accounts[i-1].guid;

      }

    });

    afterEach(function () {
      client = null;
      account = null;
      clients = [];
      accounts = [];
    });

    it('should perform tasks generation', async function () {

      postsCreateJoiStub
        .withArgs({
        clientGuid: client.guid,
        accountGuid: client.account_use,
        postLink,
      })
        .returns({
          status: 'ok',
          message: 'Posts record created',
          payload: {
            clientGuid: client.guid,
            accountGuid: client.account_use,
            postLink,
            totalLikes: casual.integer(0, 100),
            totalDislikes: casual.integer(0, 100),
            requestedLikes: casual.integer(0, 100),
            requestedComments: casual.integer(0, 100),
            receivedLikes: casual.integer(0, 100),
            receivedComments: casual.integer(0, 100),
            allLikesDone: casual.boolean,
            allCommentsDone: casual.boolean,
          },
      });

      const accountsList = [];

      for (let i = 1; i <= 3; i++) {
        accountsList.push({
          id: clients[i-1].accounts[0].id,
          guid: clients[i-1].accounts[0].guid,
          client: clients[i-1],
          inst_profile: clients[i-1].accounts[0].inst_profile,
          posts_received_day: clients[i-1].accounts[0].posts_received_day,
          posts_received_total: clients[i-1].accounts[0].posts_received_total,
        });
      }

      getAccountsByRoomsStub
        .withArgs([1, 2, 3])
        .returns({
          status: 'ok',
          message: 'List of clients',
          payload: accountsList,
        });

      const generateTasksJoiRes = await sails.helpers.tasks.generateTasksJoi({
        client,
        postLink,
      });

      expect(tasksCreateJoiStub.callCount).to.be.eq(3);
      expect(postsUpdateJoiStub.callCount).to.be.eq(3);
      expect(sendMessageJoiStub.callCount).to.be.eq(3);
      expect(accountUpdateJoiStub.callCount).to.be.eq(4);
      expect(generateTasksJoiRes).to.have.property('status', 'ok');
      expect(generateTasksJoiRes).to.have.property('message', 'Generate tasks performed');

    });

  });

});

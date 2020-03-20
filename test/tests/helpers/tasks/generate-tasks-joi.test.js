"use strict";

const {expect} = require('chai');
const sinon = require('sinon');
const mlog = require('mocha-logger');
const casual = require('casual');

const clientSdk = require('../../../sdk/client.js');
const accountSdk = require('../../../sdk/account.js');

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

        const generateTasksRes = await sails.helpers.tasks.generateTasksJoi({
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

        const generateTasksRes = await sails.helpers.tasks.generateTasksJoi({
          client: client,
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

        const generateTasksRes = await sails.helpers.tasks.generateTasksJoi({
          client: client,
          postLink: postLink,
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

        const generateTasksJoiRes = await sails.helpers.tasks.generateTasksJoi({
          client: client,
          postLink: postLink,
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

        const generateTasksJoiRes = await sails.helpers.tasks.generateTasksJoi({
          client: client,
          postLink: postLink,
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

        const generateTasksJoiRes = await sails.helpers.tasks.generateTasksJoi({
          client: client,
          postLink: postLink,
        });
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.be.an.instanceof(Error);
        expect(e.raw.payload.error).to.has.property('message');
        expect(e.raw.payload.error.message).to.include(`error: Max amount of outgoing posts reached`);
      }

    });

  });

});

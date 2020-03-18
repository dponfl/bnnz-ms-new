"use strict";

const {expect} = require('chai');
const sinon = require('sinon');
const mlog = require('mocha-logger');
const casual = require('casual');
const clientSdk = require('../../../sdk/client.js');

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

      const client = await clientSdk.generateClient();

      try {

        const generateTasksRes = await sails.helpers.tasks.generateTasksJoi({
          client: client,
          postLink: 'https://www.instagram.dom/' + casual.uuid,
        });

        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0])
          .to.have.property('message')
          .to.include('must be a valid uri with a scheme');
      }

    });

  });

});

"use strict";

const {expect} = require('chai');
const casual = require('casual');
const sinon = require('sinon');

describe('parsers:inst:ninja:checkLikesJoi test', function () {

  let customConfig;

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;
  });

  describe('Check input params', function () {

    it ('should fail for missing "instProfile" param', async function() {

      try {

        const instPostCode = casual.uuid;

        const params = {
          instPostCode,
        };

        await sails.helpers.parsers.inst.ninja.checkLikesJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.deep.include({message: '"instProfile" is required'});
      }

    });

    it ('should fail for missing "instPostCode" param', async function() {

      try {

        const instProfile = casual.username;

        const params = {
          instProfile,
        };

        await sails.helpers.parsers.inst.ninja.checkLikesJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.deep.include({message: '"instPostCode" is required'});
      }

    });

  });

  describe('Performs checkLikesJoi successfully', function () {

    it('should perform checkLikesJoi successfully', async function () {

      try {

        const instProfile = casual.username;
        const instPostCode = casual.uuid;

        const params = {
          instProfile,
          instPostCode,
        };

        const checkLikesJoiRes = await sails.helpers.parsers.inst.ninja.checkLikesJoi(params);

        expect(checkLikesJoiRes).to.be.eq(true);

      } catch (e) {
        expect.fail(`Unexpected error: ${JSON.stringify(e, null, 3)}`);
      }

    });

  });

});

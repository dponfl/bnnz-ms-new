"use strict";

const {expect} = require('chai');
const casual = require('casual');
const sinon = require('sinon');

describe('parsers:inst:ninja:checkLikesCommentsJoi test', function () {

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

  describe('Performs checkLikesCommentsJoi successfully', function () {

    it('should perform checkLikesCommentsJoi successfully', async function () {

      try {

        const instProfile = casual.username;
        const instPostCode = casual.uuid;

        const params = {
          instProfile,
          instPostCode,
        };

        const checkLikesJoiRes = await sails.helpers.parsers.inst.ninja.checkLikesCommentsJoi(params);

        expect(checkLikesJoiRes).to.include({
          likeMade: true,
          commentMade: true,
          commentText: 'Пример комментария на пост',
        });

      } catch (e) {
        expect.fail(`Unexpected error: ${JSON.stringify(e, null, 3)}`);
      }

    });

  });

});

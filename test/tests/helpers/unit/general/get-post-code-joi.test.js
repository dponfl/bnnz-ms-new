"use strict";

const {expect} = require('chai');
const casual = require('casual');

describe('general.getPostCodeJoi test (unit)', () => {

  let customConfig;

  beforeEach(async function () {

    const customConfigRaw = await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;

  });

  it ('should fail for missing "postLink" param', async () => {
    try {

      const paramsObj = {};

      await sails.helpers.general.getPostCodeJoi(paramsObj);

      expect.fail('Unexpected success');

    } catch (e) {
      expect(e.raw.payload.error.details[0]).to.have.property('message', '"postLink" is required');
    }
  });

  it('should throw error on wrong postLink value', async function () {

    const postLink = 'https://www.instagram.dom/' + casual.uuid;

    try {

      const paramsObj = {
        postLink: postLink,
      };

      await sails.helpers.general.getPostCodeJoi(paramsObj);

      expect.fail('Unexpected success');

    } catch (e) {
      expect(e.raw.payload.error.details[0])
        .to.have.property('message')
        .to.include(`"postLink" with value "${postLink}" fails to match the required pattern`);
    }

  });

  it ('should successfully perform getPostCodeJoi', async () => {
    try {

      const postCode = casual.uuid;

      const postLink = customConfig.config.general.instagram_post_prefix + postCode;

      const paramsObj = {
        postLink,
      };

      const getPostCodeJoiRes = await sails.helpers.general.getPostCodeJoi(paramsObj);

      expect(getPostCodeJoiRes).to.be.eq(postCode);

    } catch (e) {
      expect.fail(`Expect failed:\n${JSON.stringify(e, null, 3)}`);
    }
  });

});

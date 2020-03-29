"use strict";

const {expect} = require('chai');
const mlog = require('mocha-logger');
const casual = require('casual');
const sinon = require('sinon');

describe('storage.postsCreateJoi test (unit)', () => {

  let customConfig;
  let postsCreateStub;

  beforeEach(async function () {

    const customConfigRaw = await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;

    postsCreateStub = sinon.stub(Posts, 'create');
  });

  afterEach(async function () {
    postsCreateStub.restore();
  });

  it ('should fail for missing "clientGuid" param', async () => {
      try {

        const paramsObj = {
          accountGuid: casual.uuid,
          postLink: customConfig.config.general.instagram_post_prefix + casual.uuid,
        };

        await sails.helpers.storage.postsCreateJoi(paramsObj);

        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"clientGuid" is required');
      }
    });

  it ('should fail for missing "accountGuid" param', async () => {
      try {

        const paramsObj = {
          clientGuid: casual.uuid,
          postLink: customConfig.config.general.instagram_post_prefix + casual.uuid,
        };

        await sails.helpers.storage.postsCreateJoi(paramsObj);

        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"accountGuid" is required');
      }
    });

  it ('should fail for missing "postLink" param', async () => {
      try {

        const paramsObj = {
          clientGuid: casual.uuid,
          accountGuid: casual.uuid,
        };

        await sails.helpers.storage.postsCreateJoi(paramsObj);

        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"postLink" is required');
      }
    });

  it('should throw error on wrong postLink value', async function () {

    const postLink = 'https://www.instagram.dom/' + casual.uuid;

    try {

      const paramsObj = {
        clientGuid: casual.uuid,
        accountGuid: casual.uuid,
        postLink: postLink,
      };

      await sails.helpers.storage.postsCreateJoi(paramsObj);

      expect.fail('Unexpected success');

    } catch (e) {
      expect(e.raw.payload.error.details[0])
        .to.have.property('message')
        .to.include(`"postLink" with value "${postLink}" fails to match the required pattern`);
    }

  });

  it ('should create Posts record', async () => {
    try {

      const paramsObj = {
        clientGuid: casual.uuid,
        accountGuid: casual.uuid,
        postLink: customConfig.config.general.instagram_post_prefix + casual.uuid,
        totalLikes: casual.integer(0, 100),
        totalDislikes: casual.integer(0, 100),
        requestedLikes: casual.integer(0, 100),
        requestedComments: casual.integer(0, 100),
        receivedLikes: casual.integer(0, 100),
        receivedComments: casual.integer(0, 100),
        allLikesDone: casual.boolean,
        allCommentsDone: casual.boolean,
      };

      postsCreateStub.returns(paramsObj);

      const postsRecRaw = await sails.helpers.storage.postsCreateJoi(paramsObj);

      expect(postsRecRaw.payload).to.be.deep.include(paramsObj);

    } catch (e) {
      expect.fail(`Expect failed:\n${JSON.stringify(e, null, 3)}`);
    }
  });

});

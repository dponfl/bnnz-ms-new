"use strict";

const {expect} = require('chai');
const casual = require('casual');
const sinon = require('sinon');
const postsSdk = require('../../../../sdk/posts');

describe('storage.postsGetJoi test (unit)', function() {

  let customConfig;
  let postsFindStub;

  beforeEach(async function () {

    const customConfigRaw = await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;

    postsFindStub = sinon.stub(Posts, 'find');
  });

  afterEach(async function () {
    postsFindStub.restore();
  });

  it ('should fail for missing all valuable params', async () => {
      try {

        const paramsObj = {
          otherConditions: {
            guid: casual.uuid,
          },
        };

        await sails.helpers.storage.postsGetJoi(paramsObj);

        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.deep.include({message: '"value" must contain at least one of [guid, clientGuid, accountGuid, postLink, allLikesDone, allCommentsDone]'});
      }
    });

  it ('should fail for unknown param', async () => {
      try {

        const paramsObj = {
          someParameter: casual.uuid,
        };

        await sails.helpers.storage.postsGetJoi(paramsObj);

        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.deep.include({message: '"someParameter" is not allowed'});
      }
    });


  it ('should get Posts record', async () => {
    try {

      const paramsObj = await postsSdk.generatePost();

      postsFindStub.returns([paramsObj]);

      const postsRecRaw = await sails.helpers.storage.postsGetJoi({guid: paramsObj.guid});

      expect(postsRecRaw.payload).to.be.deep.include(paramsObj);

    } catch (e) {
      expect.fail(`Expect failed:\n${JSON.stringify(e, null, 3)}`);
    }
  });

});

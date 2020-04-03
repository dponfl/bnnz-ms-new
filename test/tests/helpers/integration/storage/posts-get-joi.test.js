"use strict";

const {expect} = require('chai');
const postsSdk = require('../../../../sdk/posts');

describe('storage.postsGetJoi test (integration)', () => {

  it ('should get Posts record', async () => {
    try {

      const postsRec = await postsSdk.createPostDB();

      const postsRecRaw = await sails.helpers.storage.postsGetJoi({guid: postsRec.guid});

      await postsSdk.deletePostByGuidDB(postsRec.guid);

      expect(postsRecRaw).to.deep.include({
        status: 'ok',
        message: 'Posts record(s) found',
      });
      expect(postsRecRaw.payload).to.be.deep.include(postsRec);

    } catch (e) {
      expect.fail(`Expect failed:\n${JSON.stringify(e, null, 3)}`);
    }
  });

});

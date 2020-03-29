"use strict";

const {expect} = require('chai');
const casual = require('casual');

describe('storage.postsCreateJoi test (integration)', () => {

  let customConfig;

  beforeEach(async function () {

    const customConfigRaw = await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;

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

      const postsRecRaw = await sails.helpers.storage.postsCreateJoi(paramsObj);

      expect(postsRecRaw.payload).to.be.deep.include(paramsObj);

      const postsRecFromDB = await Posts.findOne({
        guid: postsRecRaw.payload.guid,
      });

      await Posts.destroy({guid: postsRecRaw.payload.guid});

      expect(postsRecFromDB).to.be.deep.include(paramsObj);
    } catch (e) {
      expect.fail(`Expect failed:\n${JSON.stringify(e, null, 3)}`);
    }
  });

});

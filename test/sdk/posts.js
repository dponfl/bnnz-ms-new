"use strict";

const casual = require('casual');
const mlog = require('mocha-logger');
const moment = require('moment');


module.exports = {

  deleteAllPostsDB: async () => {
    const funcName = 'test:sdk:posts:deleteAllPostsDB';
    try {
      await Posts.destroy({});
    } catch (e) {
      mlog.error(`${funcName} Error: code: ${e.code}, message: ${e.message}`);
    }
  },

  deletePostByGuidDB: async (postGuid) => {
    const funcName = 'test:sdk:posts:deletePostByGuidDB';
    try {
      await Posts.destroy({guid: postGuid});
    } catch (e) {
      mlog.error(`${funcName} Error: code: ${e.code}, message: ${e.message}`);
    }
  },

  createPostDB: async (post = null) => {
    const funcName = 'test:sdk:posts:createPostDB';

    let postRec;

    try {

      postRec = await generatePost(post);
      postRec = _.omit(postRec, ['id', 'createdAt', 'updatedAt']);

      postRec = await Posts.create(postRec).fetch();

      return postRec;

    } catch (e) {
      mlog.error(`${funcName} Error: \ncode: ${e.code}\nmessage: ${e.message}\npostRec: ${JSON.stringify(postRec)}`);
    }

  },

  generatePost: async (post = null) => {
    const funcName = 'test:sdk:posts:generatePost';

    let postRec;

    try {

      postRec = await generatePost(post);

      return postRec;

    } catch (e) {
      mlog.error(`${funcName} Error: \ncode: ${e.code}\nmessage: ${e.message}\npostRec: ${JSON.stringify(postRec)}`);
    }

  },

};

async function generatePost(post = null) {
  const funcName = 'posts:generatePost';

  let postRec;

  try {

    postRec = {
      id: casual.integer(1, 1000),
      guid: casual.uuid,
      clientGuid: casual.uuid,
      accountGuid: casual.uuid,
      postLink: sails.config.custom.config.general.instagram_post_prefix + casual.uuid,
      totalLikes: casual.integer(0, 100),
      totalDislikes: casual.integer(0, 100),
      requestedLikes: casual.integer(0, 30),
      requestedComments: casual.integer(0, 20),
      receivedLikes: casual.integer(0, 30),
      receivedComments: casual.integer(0, 20),
      allLikesDone: casual.boolean,
      allCommentsDone: casual.boolean,
      createdAt: moment().format(),
      updatedAt: moment().add(1, 'minutes').format(),
    };

    if (post != null) {
      postRec = _.assign(postRec, post);
    }

    return postRec;

  } catch (e) {
    mlog.error(`${funcName} Error: \ncode: ${e.code}\nmessage: ${e.message}\npostRec: ${JSON.stringify(postRec)}`);
  }
}
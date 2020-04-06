"use strict";

const {expect} = require('chai');
const casual = require('casual');
const sinon = require('sinon');

const clientSdk = require('../../../../../sdk/client');
const accountSdk = require('../../../../../sdk/account.js');
const messagesSdk = require('../../../../../sdk/messages');
const pushMessagesSdk = require('../../../../../sdk/pushMessages');
const tasksSdk = require('../../../../../sdk/tasks');
const postsSdk = require('../../../../../sdk/posts');

describe('pushMessages:tasks:callbackLikesJoi test', function () {

  let customConfig;

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;
  });

  describe('Check input params', function () {

    it ('should fail for missing "client" param', async () => {

      const query = {
        id: casual.uuid,
        data: `push_msg_tsk_l_${casual.uuid}`,
        message: await messagesSdk.generateMessage(),
      };

      try {

        const messageData = await pushMessagesSdk.generateMessageData('likes');
        const params = {
          query,
          messageData,
        };

        await sails.helpers.pushMessages.tasks.callbackLikesJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        // expect(e.raw.payload.error.details[0]).to.have.property('message', '"client" is required');
        expect(e.raw.payload.error.details[0]).to.deep.include({
          message: '"client" is required'
        });
      }

    });

    it ('should fail for missing "query" param', async () => {

      const client = await clientSdk.generateClient();

      try {

        const messageData = await pushMessagesSdk.generateMessageData('likes');
        const params = {
          client,
          messageData,
        };

        await sails.helpers.pushMessages.tasks.callbackLikesJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"query" is required');
      }

    });

    it ('should fail for missing "messageData" param', async () => {

      const client = await clientSdk.generateClient();
      const query = {
        id: casual.uuid,
        data: `push_msg_tsk_l_${casual.uuid}`,
        message: await messagesSdk.generateMessage(),
      };

      try {

        const params = {
          client,
          query,
        };

        await sails.helpers.pushMessages.tasks.callbackLikesJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"messageData" is required');
      }

    });

    it ('should fail for wrong query.data format', async () => {

      const client = await clientSdk.generateClient();
      const query = {
        id: casual.uuid,
        data: `push_msg_tsk_l_`,
        message: await messagesSdk.generateMessage(),
      };
      const messageData = await pushMessagesSdk.generateMessageData('likes');

      try {

        const params = {
          client,
          query,
          messageData,
        };

        await sails.helpers.pushMessages.tasks.callbackLikesJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.message).to.include(`Error: query.data has wrong format`);
      }

    });

    it ('should fail for wrong task guid', async () => {

      const client = await clientSdk.generateClient();
      const query = {
        id: casual.uuid,
        data: `push_msg_tsk_l_ABC`,
        message: await messagesSdk.generateMessage(),
      };
      const messageData = await pushMessagesSdk.generateMessageData('likes');

      try {

        const params = {
          client,
          query,
          messageData,
        };

        await sails.helpers.pushMessages.tasks.callbackLikesJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.message).to.include(`Error: query.data task code is not a guid`);
      }

    });

  });

  describe('Check other conditions causing errors', function () {

    let client;
    let accounts = [];
    let postLink;

    let tasksGetJoiStub, postsGetJoiStub;

    beforeEach(async function () {
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

      tasksGetJoiStub = sinon.stub(sails.helpers.storage, 'tasksGetJoi');
      postsGetJoiStub = sinon.stub(sails.helpers.storage, 'postsGetJoi');
    });

    afterEach(function () {
      client = null;
      accounts = [];

      tasksGetJoiStub.restore();
      postsGetJoiStub.restore();
    });

    it('should fail for > 1 tasks with same guid', async function () {


      try {

        const tasks = [];

        for (let i = 0; i <= 2; i++) {
          tasks.push(await tasksSdk.generateTask());
        }

        tasksGetJoiStub
          .withArgs({
            guid: tasks[0].guid,
          })
          .returns({
          status: 'ok',
          message: 'Tasks record(s) found',
          payload: tasks,
        });

        const client = await clientSdk.generateClient();
        const query = {
          id: casual.uuid,
          data: `push_msg_tsk_l_${tasks[0].guid}`,
          message: await messagesSdk.generateMessage(),
        };
        const messageData = await pushMessagesSdk.generateMessageData('likes');

        const params = {
          client,
          query,
          messageData,
        };

        await sails.helpers.pushMessages.tasks.callbackLikesJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.message).to.include(`Error: Several tasks with the same guid`);
      }


    });

    it('should fail for no tasks for a guid', async function () {


      try {

        const taskGuid = casual.uuid;

        const tasks = [];

        tasksGetJoiStub
          .withArgs({
            guid: taskGuid,
          })
          .returns({
            status: 'ok',
            message: 'Tasks record(s) found',
            payload: tasks,
        });

        const client = await clientSdk.generateClient();
        const query = {
          id: casual.uuid,
          data: `push_msg_tsk_l_${taskGuid}`,
          message: await messagesSdk.generateMessage(),
        };
        const messageData = await pushMessagesSdk.generateMessageData('likes');

        const params = {
          client,
          query,
          messageData,
        };

        await sails.helpers.pushMessages.tasks.callbackLikesJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.message).to.include(`Error: No tasks for this guid`);
      }


    });

    it('should fail for no accounts found for a guid', async function () {


      try {

        const tasks = [];

        tasks.push(await tasksSdk.generateTask());

        tasksGetJoiStub
          .withArgs({
            guid: tasks[0].guid,
          })
          .returns({
            status: 'ok',
            message: 'Tasks record(s) found',
            payload: tasks,
        });

        const query = {
          id: casual.uuid,
          data: `push_msg_tsk_l_${tasks[0].guid}`,
          message: await messagesSdk.generateMessage(),
        };
        const messageData = await pushMessagesSdk.generateMessageData('likes');

        const params = {
          client,
          query,
          messageData,
        };

        await sails.helpers.pushMessages.tasks.callbackLikesJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.message).to.include(`Error: No account found for this guid`);
      }


    });

    it('should fail for no accounts found for a guid', async function () {


      try {

        const tasks = [];

        tasks.push(await tasksSdk.generateTask({
          accountGuid: casual.uuid,
        }));

        tasksGetJoiStub
          .withArgs({
            guid: tasks[0].guid,
          })
          .returns({
            status: 'ok',
            message: 'Tasks record(s) found',
            payload: tasks,
        });

        const query = {
          id: casual.uuid,
          data: `push_msg_tsk_l_${tasks[0].guid}`,
          message: await messagesSdk.generateMessage(),
        };
        const messageData = await pushMessagesSdk.generateMessageData('likes');

        const params = {
          client,
          query,
          messageData,
        };

        await sails.helpers.pushMessages.tasks.callbackLikesJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.message).to.include(`Error: No account found for this guid`);
      }


    });

    it('should fail for no post found for a postGuid', async function () {


      try {

        const tasks = [];

        const posts = [];

        tasks.push(await tasksSdk.generateTask({
          accountGuid: accounts[0].guid,
          postGuid: casual.uuid,
        }));

        tasksGetJoiStub
          .withArgs({
            guid: tasks[0].guid,
          })
          .returns({
            status: 'ok',
            message: 'Tasks record(s) found',
            payload: tasks,
        });

        postsGetJoiStub
          .withArgs({
            guid: tasks[0].postGuid,
          })
          .returns({
            status: 'ok',
            message: 'Posts record(s) found',
            payload: posts,
        });

        const query = {
          id: casual.uuid,
          data: `push_msg_tsk_l_${tasks[0].guid}`,
          message: await messagesSdk.generateMessage(),
        };
        const messageData = await pushMessagesSdk.generateMessageData('likes');

        const params = {
          client,
          query,
          messageData,
        };

        await sails.helpers.pushMessages.tasks.callbackLikesJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.message).to.include(`Error: No post found for this guid`);
      }


    });

    it('should fail for several posts found for a postGuid', async function () {


      try {

        const tasks = [];

        const posts = [];

        tasks.push(await tasksSdk.generateTask({
          accountGuid: accounts[0].guid,
          postGuid: casual.uuid,
        }));

        for (let i = 0; i <= 1; i++) {
          posts.push(await postsSdk.generatePost());
        }

        tasksGetJoiStub
          .withArgs({
            guid: tasks[0].guid,
          })
          .returns({
            status: 'ok',
            message: 'Tasks record(s) found',
            payload: tasks,
        });

        postsGetJoiStub
          .withArgs({
            guid: tasks[0].postGuid,
          })
          .returns({
            status: 'ok',
            message: 'Posts record(s) found',
            payload: posts,
        });

        const query = {
          id: casual.uuid,
          data: `push_msg_tsk_l_${tasks[0].guid}`,
          message: await messagesSdk.generateMessage(),
        };
        const messageData = await pushMessagesSdk.generateMessageData('likes');

        const params = {
          client,
          query,
          messageData,
        };

        await sails.helpers.pushMessages.tasks.callbackLikesJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.message).to.include(`Error: More than one record for this guid`);
      }


    });

  });

  describe('Performs callback successfully', function () {

    let client;
    let accounts = [];
    let postLink;

    let tasks;
    let posts;


    let tasksGetJoiStub;
    let postsGetJoiStub;
    let getPostCodeJoiStub;
    let checkLikesJoiStub;
    let tasksUpdateJoiStub;
    let postsUpdateJoiStub;
    let sendMessageJoiStub;

    beforeEach(async function () {
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

      tasks = [];
      posts = [];

      tasksGetJoiStub = sinon.stub(sails.helpers.storage, 'tasksGetJoi');
      postsGetJoiStub = sinon.stub(sails.helpers.storage, 'postsGetJoi');
      getPostCodeJoiStub = sinon.stub(sails.helpers.general, 'getPostCodeJoi');
      checkLikesJoiStub = sinon.stub(sails.helpers.parsers.inst.ninja, 'checkLikesJoi');
      tasksUpdateJoiStub = sinon.stub(sails.helpers.storage, 'tasksUpdateJoi');
      postsUpdateJoiStub = sinon.stub(sails.helpers.storage, 'postsUpdateJoi');
      sendMessageJoiStub = sinon.stub(sails.helpers.messageProcessor, 'sendMessageJoi');
    });

    afterEach(function () {
      client = null;
      accounts = [];

      tasks = [];
      posts = [];

      tasksGetJoiStub.restore();
      postsGetJoiStub.restore();
      getPostCodeJoiStub.restore();
      checkLikesJoiStub.restore();
      tasksUpdateJoiStub.restore();
      postsUpdateJoiStub.restore();
      sendMessageJoiStub.restore();
    });

    it('should send confirmation that the task was performed successfully', async function () {


      try {

        tasks.push(await tasksSdk.generateTask({
          accountGuid: accounts[0].guid,
          postGuid: casual.uuid,
          messageId: casual.integer(1000, 100000),
        }));

        const postCode = casual.uuid;

        posts.push(await postsSdk.generatePost({
          postLink: customConfig.config.general.instagram_post_prefix + postCode,
          receivedLikes: 7,
          requestedLikes: 8,
        }));

        tasksGetJoiStub
          .withArgs({
            guid: tasks[0].guid,
          })
          .returns({
            status: 'ok',
            message: 'Tasks record(s) found',
            payload: tasks,
        });

        postsGetJoiStub
          .withArgs({
            guid: tasks[0].postGuid,
          })
          .returns({
            status: 'ok',
            message: 'Posts record(s) found',
            payload: posts,
        });

        getPostCodeJoiStub
          .withArgs({
            postLink: posts[0].postLink,
          })
          .returns(postCode);

        checkLikesJoiStub
          .returns(true);

        const makeLikePerformed = true;

        tasksUpdateJoiStub
          .withArgs({
            criteria: tasks[0].guid,
            data: {
              makeLikePerformed,
            }
          });

        const data = {
          receivedLikes: 8,
          allLikesDone: true,
        };

        postsUpdateJoiStub
          .withArgs({
            criteria: {guid: posts[0].guid},
            data,
          });

        const sendMessageRes = {
          message_id: casual.integer(1000, 100000),
        };

        sendMessageJoiStub
          .withArgs({
            client,
            messageData: customConfig.pushMessages.tasks.likes_done.messages[0],
            additionalTokens: [
              {
                token: '$PostLink$',
                value: posts[0].postLink,
              },
            ],
            additionalParams: {
              chat_id: client.chat_id,
              message_id: tasks[0].messageId,
            },
          })
          .returns(sendMessageRes);

        const query = {
          id: casual.uuid,
          data: `push_msg_tsk_l_${tasks[0].guid}`,
          message: await messagesSdk.generateMessage(),
        };
        const messageData = await pushMessagesSdk.generateMessageData('likes');

        const params = {
          client,
          query,
          messageData,
        };

        const callbackLikesJoiRes = await sails.helpers.pushMessages.tasks.callbackLikesJoi(params);

        expect(tasksGetJoiStub.callCount).to.be.eq(1);
        expect(postsGetJoiStub.callCount).to.be.eq(1);
        expect(getPostCodeJoiStub.callCount).to.be.eq(1);
        expect(checkLikesJoiStub.callCount).to.be.eq(1);
        expect(tasksUpdateJoiStub.callCount).to.be.eq(1);
        expect(postsUpdateJoiStub.callCount).to.be.eq(1);
        expect(sendMessageJoiStub.callCount).to.be.eq(1);
        expect(callbackLikesJoiRes).to.deep.include({
          status: 'ok',
          message: 'callbackLikes performed',
          payload: {
            res: sendMessageRes,
          },
        })

      } catch (e) {
        expect.fail(`Unexpected error: ${JSON.stringify(e, null, 3)}`);
      }

    });

    it('should send notification that the task was not performed', async function () {

      try {

        tasks.push(await tasksSdk.generateTask({
          accountGuid: accounts[0].guid,
          postGuid: casual.uuid,
          messageId: casual.integer(1000, 100000),
        }));

        const postCode = casual.uuid;

        posts.push(await postsSdk.generatePost({
          postLink: customConfig.config.general.instagram_post_prefix + postCode,
          receivedLikes: 7,
          requestedLikes: 8,
        }));

        tasksGetJoiStub
          .withArgs({
            guid: tasks[0].guid,
          })
          .returns({
            status: 'ok',
            message: 'Tasks record(s) found',
            payload: tasks,
        });

        postsGetJoiStub
          .withArgs({
            guid: tasks[0].postGuid,
          })
          .returns({
            status: 'ok',
            message: 'Posts record(s) found',
            payload: posts,
        });

        getPostCodeJoiStub
          .withArgs({
            postLink: posts[0].postLink,
          })
          .returns(postCode);

        checkLikesJoiStub
          .returns(false);

        const newMessageData = customConfig.pushMessages.tasks.likes_not_done.messages[0].message;

        newMessageData.inline_keyboard = _.concat(newMessageData.inline_keyboard,
          [
            [
              {
                "text": "MSG_TASK_PERFORM_BTN",
                "callback_data": "push_msg_tsk_l_" + tasks[0].guid
              }
            ]
          ]
        );

        const sendMessageRes = {
          message_id: casual.integer(1000, 100000),
        };

        sendMessageJoiStub
          .withArgs({
            client,
            messageData: newMessageData,
            additionalTokens: [
              {
                token: '$PostLink$',
                value: posts[0].postLink,
              },
            ],
            additionalParams: {
              chat_id: client.chat_id,
              message_id: tasks[0].messageId,
            },
          })
          .returns(sendMessageRes);

        const query = {
          id: casual.uuid,
          data: `push_msg_tsk_l_${tasks[0].guid}`,
          message: await messagesSdk.generateMessage(),
        };
        const messageData = await pushMessagesSdk.generateMessageData('likes');

        const params = {
          client,
          query,
          messageData,
        };

        const callbackLikesJoiRes = await sails.helpers.pushMessages.tasks.callbackLikesJoi(params);

        expect(tasksGetJoiStub.callCount).to.be.eq(1);
        expect(postsGetJoiStub.callCount).to.be.eq(1);
        expect(getPostCodeJoiStub.callCount).to.be.eq(1);
        expect(checkLikesJoiStub.callCount).to.be.eq(1);
        expect(sendMessageJoiStub.callCount).to.be.eq(1);
        expect(callbackLikesJoiRes).to.deep.include({
          status: 'ok',
          message: 'callbackLikes performed',
          payload: {
            res: sendMessageRes,
          },
        })

      } catch (e) {
        expect.fail(`Unexpected error: ${JSON.stringify(e, null, 3)}`);
      }

    });

  });

});

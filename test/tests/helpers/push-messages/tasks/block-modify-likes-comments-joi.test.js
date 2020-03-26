"use strict";

const {expect} = require('chai');
const casual = require('casual');
const clientSdk = require('../../../../sdk/client');
const pushMessagesSdk = require('../../../../sdk/pushMessages');

describe('pushMessages:tasks:blockModifyLikesCommentsJoi test', function () {

  describe('Check input params', function () {

    it ('should fail for missing "client" param', async () => {

      try {

        const messageData = await pushMessagesSdk.generateMessageData('likes', {
          actionType: 'text',
        });
        const additionalParams = {
          taskGuid: casual.uuid,
        };

        const params = {
          messageData,
          additionalParams,
        };

        await sails.helpers.pushMessages.tasks.blockModifyLikesCommentsJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"client" is required');
      }

    });

    it ('should fail for missing "messageData" param', async () => {

      try {

        const client = await clientSdk.generateClient();
        const additionalParams = {
          taskGuid: casual.uuid,
        };

        const params = {
          client,
          additionalParams,
        };

        await sails.helpers.pushMessages.tasks.blockModifyLikesCommentsJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"messageData" is required');
      }

    });

    it ('should fail for missing "additionalParams" param', async () => {

      try {

        const client = await clientSdk.generateClient();
        const messageData = await pushMessagesSdk.generateMessageData('likes', {
          actionType: 'text',
        });

        const params = {
          client,
          messageData,
        };

        await sails.helpers.pushMessages.tasks.blockModifyLikesCommentsJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"additionalParams" is required');
      }

    });

    it ('should fail for missing "additionalParams.taskGuid" param', async () => {

      try {

        const client = await clientSdk.generateClient();
        const messageData = await pushMessagesSdk.generateMessageData('likes', {
          actionType: 'text',
        });
        const additionalParams = {
          someKey: casual.uuid,
        };


        const params = {
          client,
          messageData,
          additionalParams,
        };

        await sails.helpers.pushMessages.tasks.blockModifyLikesCommentsJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"additionalParams.taskGuid" is required');
      }

    });

  });

  describe('Perform blockModifyLikesCommentsJoi', function () {

    it('should successfully call blockModifyLikesCommentsJoi', async function () {

      try {

        const taskGuid = casual.uuid;
        const client = await clientSdk.generateClient();
        const messageData = await pushMessagesSdk.generateMessageData('likes', {
          actionType: 'text',
        });
        const additionalParams = {
          taskGuid,
        };

        const params = {
          client,
          messageData,
          additionalParams,
        };

        const res = await sails.helpers.pushMessages.tasks.blockModifyLikesCommentsJoi(params);
        expect(res).to.deep.nested.include({'message.inline_keyboard[0][0]': {
          "text": "MSG_TASK_PERFORM_BTN",
          "callback_data": `push_msg_tsk_lc_${taskGuid}`
        }});

      } catch (e) {
        expect.fail(`Unexpected error: \n${JSON.stringify(e, null, 3)}`);
      }

    });

  });

});

"use strict";

const {expect} = require('chai');
const mlog = require('mocha-logger');
const casual = require('casual');
const sinon = require('sinon');
const tasksSdk = require('../../../../sdk/tasks');

describe('storage.tasksGetJoi test (unit)', () => {

  let customConfig;
  let tasksFindStub;

  beforeEach(async function () {

    const customConfigRaw = await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;

    tasksFindStub = sinon.stub(Tasks, 'find');
  });

  afterEach(async function () {
    tasksFindStub.restore();
  });

  it ('should fail for missing all valuable params', async () => {
      try {

        const paramsObj = {
          otherConditions: {
            guid: casual.uuid,
          },
        };

        await sails.helpers.storage.tasksGetJoi(paramsObj);

        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.deep.include({message: '"value" must contain at least one of [taskGuid, clientGuid, accountGuid, postGuid, messageId, makeLike, makeComment, makeLikePerformed, makeCommentPerformed]'});
      }
    });


  it ('should get Tasks record', async () => {
    try {

      const paramsObj = await tasksSdk.generateTask();

      tasksFindStub.returns([paramsObj]);

      const tasksRecRaw = await sails.helpers.storage.tasksGetJoi({guid: paramsObj.guid});

      expect(tasksRecRaw.payload).to.be.deep.include(paramsObj);

    } catch (e) {
      expect.fail(`Expect failed:\n${JSON.stringify(e, null, 3)}`);
    }
  });

});

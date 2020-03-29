"use strict";

const {expect} = require('chai');
const mlog = require('mocha-logger');
const casual = require('casual');
const sinon = require('sinon');
const tasksSdk = require('../../../../sdk/tasks');

describe('storage.tasksGetJoi test (integration)', () => {

  let customConfig;
  let tasksFindStub;

  beforeEach(async function () {

    const customConfigRaw = await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;

  });


  it ('should get Tasks record', async () => {
    try {

      const tasksRec = await tasksSdk.createTaskDB();

      const tasksRecRaw = await sails.helpers.storage.tasksGetJoi({guid: tasksRec.guid});

      await tasksSdk.deleteTaskByGuidDB(tasksRec.guid);

      expect(tasksRecRaw.payload).to.be.deep.include(tasksRec);

    } catch (e) {
      expect.fail(`Expect failed:\n${JSON.stringify(e, null, 3)}`);
    }
  });

});

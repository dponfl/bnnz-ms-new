"use strict";

const {expect} = require('chai');
const tasksSdk = require('../../../../sdk/tasks');

describe('storage.tasksGetJoi test (integration)', () => {

  it ('should get Tasks record', async () => {
    try {

      const tasksRec = await tasksSdk.createTaskDB();

      const tasksRecRaw = await sails.helpers.storage.tasksGetJoi({guid: tasksRec.guid});

      await tasksSdk.deleteTaskByGuidDB(tasksRec.guid);

      expect(tasksRecRaw).to.deep.include({
        status: 'ok',
        message: 'Tasks record(s) found',
      });
      expect(tasksRecRaw.payload).to.be.deep.include(tasksRec);

    } catch (e) {
      expect.fail(`Expect failed:\n${JSON.stringify(e, null, 3)}`);
    }
  });

});

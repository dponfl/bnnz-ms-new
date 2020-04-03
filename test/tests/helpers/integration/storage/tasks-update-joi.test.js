"use strict";

const {expect} = require('chai');
const casual = require('casual');

describe('storage.tasksUpdateJoi test (integration)', function () {

  let customConfig;

  before(async function () {
    const customConfigRaw = await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;
  });

    it('should update Tasks record', async function () {

      try {

        const initialRecord = {
          postGuid: casual.uuid,
          clientGuid: casual.uuid,
          accountGuid: casual.uuid,
          messenger: customConfig.enums.messenger.TELEGRAM,
          makeLikePerformed: false,
          makeCommentPerformed: false,
          commentText: casual.words(7),
        };

        const initialRecordResRaw = await sails.helpers.storage.tasksCreateJoi(initialRecord);
        const initialRecordRes = initialRecordResRaw.payload;

        const updateParams = {
          criteria: {
            guid: initialRecordRes.guid,
          },
          data: {
            makeLikePerformed: true,
            makeCommentPerformed: true,
            commentText: casual.words(7),
          },
        };

        const tasksUpdateJoiRes = await sails.helpers.storage.tasksUpdateJoi(updateParams);

        const updatedTasksRecRaw = await sails.helpers.storage.tasksGetJoi({
          guid: initialRecordRes.guid,
        });

        await Tasks.destroy({
          guid: initialRecordRes.guid,
        });

        expect(tasksUpdateJoiRes).to.deep.include({
          status: 'ok',
          message: 'Task record updated',
          payload: {
            criteria: updateParams.criteria,
            data: updateParams.data
          },
        });
        expect(updatedTasksRecRaw).to.deep.include({
          status: 'ok',
          message: 'Tasks record(s) found',
        });
        expect(updatedTasksRecRaw.payload[0]).to.deep.include(updateParams.data);

      } catch (e) {
        expect.fail(`Unexpected failed:\n${JSON.stringify(e, null, 3)}`);
      }

    });

});

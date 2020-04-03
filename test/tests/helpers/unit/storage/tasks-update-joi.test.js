"use strict";

const {expect} = require('chai');
const casual = require('casual');

describe('storage.tasksGetJoi test (unit)', function () {

  describe('check input parameters validation', function () {

    it ('should fail for missing "criteria" param', async () => {
      try {

        const paramsObj = {
          data: {
            makeLikePerformed: casual.boolean,
            makeCommentPerformed: casual.boolean,
          },
        };

        await sails.helpers.storage.tasksUpdateJoi(paramsObj);

        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"criteria" is required');
      }
    });

    it ('should fail for missing "data" param', async () => {
      try {

        const paramsObj = {
          criteria: {
            guid: casual.uuid,
          },
        };

        await sails.helpers.storage.tasksUpdateJoi(paramsObj);

        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"data" is required');
      }
    });

  });

});

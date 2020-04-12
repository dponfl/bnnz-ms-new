"use strict";

const {expect} = require('chai');
const casual = require('casual');

describe('storage.accountFieldsPutJoi test (unit)', function () {

  describe('check input parameters validation', function () {

    it ('should fail for missing "accountGuid" param', async () => {
      try {

        const paramsObj = {
          data: {
            inst_profile: casual.username,
          },
        };

        await sails.helpers.storage.accountFieldsPutJoi(paramsObj);

        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"accountGuid" is required');
      }
    });

    it ('should fail for missing "data" param', async () => {
      try {

        const paramsObj = {
          accountGuid: casual.uuid,
        };

        await sails.helpers.storage.accountFieldsPutJoi(paramsObj);

        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"data" is required');
      }
    });

    it ('should fail for wrong "accountGuid" param', async () => {
      try {

        const paramsObj = {
          accountGuid: casual.word,
        };

        await sails.helpers.storage.accountFieldsPutJoi(paramsObj);

        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"accountGuid" must be a valid GUID');
      }
    });

  });

});

"use strict";

const {expect} = require('chai');
const sinon = require('sinon');
const mlog = require('mocha-logger');
const casual = require('casual');
const clientSdk = require('../../../../sdk/client');
const pushMessagesSdk = require('../../../../sdk/pushMessages');

describe('messageProcessor:parseSpecialTokensJoi test', function () {

  let config, pushMessages;

  before(async function () {
    const configRaw =   await sails.helpers.general.getConfig();
    config = configRaw.payload;
    pushMessages = config.pushMessages;
  });

  describe('Check input params', function () {

    it ('should fail for missing "client" param', async () => {

      try {

        const messageData = await pushMessagesSdk.generateMessageData('likes');

        const params = {
          message: messageData.message,
          additionalTokens: [
            {
              token: '$PostLink$',
              value: config.config.general.instagram_post_prefix + casual.uuid,
            },
          ],
        };

        await sails.helpers.messageProcessor.parseMessageStyleJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"client" is required');
      }

    });

    it('should fail for missing "message" param', async () => {

      const client = await clientSdk.generateClient();

      try {

        const params = {
          client: client,
          additionalTokens: [
            {
              token: '$PostLink$',
              value: config.config.general.instagram_post_prefix + casual.uuid,
            },
          ],
        };

        await sails.helpers.messageProcessor.parseMessageStyleJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"message" is required');
      }

    });

  });

});

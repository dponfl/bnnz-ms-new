"use strict";

const {expect} = require('chai');
const sinon = require('sinon');
const mlog = require('mocha-logger');
const casual = require('casual');
const clientSdk = require('../../../sdk/client.js');

describe('messageProcessor:parseMessageStyleJoi test', function () {

  let config, pushMessages;

  before(async function () {
    const configRaw =   await sails.helpers.general.getConfig();
    config = configRaw.payload;
    pushMessages = config.pushMessages;
  });

  describe('Check input params', function () {

    it ('should fail for missing "client" param', async () => {

      try {

        const params = {
          message: pushMessages.tasks.likes.messages[0].message,
          additionalTokens: [
            {
              token: '$PostLink$',
              value: config.config.general.instagram_post_prefix + casual.uuid,
            },
          ],
        };

        const res = await sails.helpers.messageProcessor.parseMessageStyleJoi(params);
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

        const res = await sails.helpers.messageProcessor.parseMessageStyleJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"message" is required');
      }

    });

  });

  describe('Performed successfully', function () {

    it('should successfully call parseSpecialTokensJoi', async function () {

      const parseSpecialTokensJoiStubRes = 'resultHtml string';

      const parseSpecialTokensJoiStub = sinon.stub(sails.helpers.messageProcessor, 'parseSpecialTokensJoi')
        .returns(parseSpecialTokensJoiStubRes);

      const client = await clientSdk.generateClient();

      const params = {
        client: client,
        message: pushMessages.tasks.likes.messages[0].message,
        additionalTokens: [
          {
            token: '$PostLink$',
            value: config.config.general.instagram_post_prefix + casual.uuid,
          },
        ],
      };

      const parseMessageStyleJoiRes = await sails.helpers.messageProcessor.parseMessageStyleJoi(params);

      expect(parseSpecialTokensJoiStub.callCount).to.be.eq(1);
      expect(parseMessageStyleJoiRes).to.be.eq(parseSpecialTokensJoiStubRes);

    });

  });

});

"use strict";

const {expect} = require('chai');
const sinon = require('sinon');
const mlog = require('mocha-logger');
const casual = require('casual');
const clientSdk = require('../../../../sdk/client');
const pushMessagesSdk = require('../../../../sdk/pushMessages');

describe('messageProcessor:performBlockModifyHelperJoi test', function () {

  let customConfig, customConfigGeneral;

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;
    customConfigGeneral = customConfig.config.general;
  });

  describe('Check input params', function () {

    it ('should fail for missing "client" param', async () => {

      try {

        const messageData = await pushMessagesSdk.generateMessageData('likes');

        const params = {
          messageData,
        };

        await sails.helpers.messageProcessor.performBlockModifyHelperJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"client" is required');
      }

    });

    it('should fail for missing "messageData" param', async () => {

      const client = await clientSdk.generateClient();

      try {

        const params = {
          client: client,
        };

        await sails.helpers.messageProcessor.performBlockModifyHelperJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error.details[0]).to.have.property('message', '"messageData" is required');
      }

    });

  });

  describe('Perform messageProcessor:performBlockModifyHelperJoi', function () {

    let simpleMessageJoiStub;
    let imgMessageJoiStub;
    let videoMessageJoiStub;
    let forcedMessageJoiStub;
    let inlineKeyboardMessageJoiStub;
    let messageSaveJoiStub;


    beforeEach(function () {
      simpleMessageJoiStub = sinon.stub(sails.helpers.mgw.telegram, 'simpleMessageJoi');
      imgMessageJoiStub = sinon.stub(sails.helpers.mgw.telegram, 'imgMessageJoi');
      videoMessageJoiStub = sinon.stub(sails.helpers.mgw.telegram, 'videoMessageJoi');
      forcedMessageJoiStub = sinon.stub(sails.helpers.mgw.telegram, 'forcedMessageJoi');
      inlineKeyboardMessageJoiStub = sinon.stub(sails.helpers.mgw.telegram, 'inlineKeyboardMessageJoi');
      messageSaveJoiStub = sinon.stub(sails.helpers.storage, 'messageSaveJoi');
    });

    afterEach(function () {
      simpleMessageJoiStub.restore();
      imgMessageJoiStub.restore();
      videoMessageJoiStub.restore();
      forcedMessageJoiStub.restore();
      inlineKeyboardMessageJoiStub.restore();
      messageSaveJoiStub.restore();
    });

    describe('Perform "performBlockModifyHelperJoi"', function () {

      let blockModifyHelperStub;

      afterEach(function () {
        blockModifyHelperStub.restore();
      });

      it('should successfully perform "performBlockModifyHelperJoi"', async function () {

        try {

          forcedMessageJoiStub
            .returns({
              status: 'ok',
              message: 'Telegram forced message was sent',
              payload: 'some payload of forcedMessageJoiStub',
            });

          const client = await clientSdk.generateClient();
          const messageData = await pushMessagesSdk.generateMessageData('likes', {
            actionType: 'text',
          });
          const additionalParams = {
            taskGuid: casual.uuid,
          };

          const params = {
            client,
            messageData,
            additionalParams,
          };

          let splitBlockModifyHelperRes = _.split(messageData.blockModifyHelper, customConfig.JUNCTION, 2);
          let blockModifyHelperBlock = splitBlockModifyHelperRes[0];
          let blockModifyHelperName = splitBlockModifyHelperRes[1];

          if (blockModifyHelperBlock && blockModifyHelperName) {

            blockModifyHelperStub = sinon.stub(sails.helpers.pushMessages[blockModifyHelperBlock], blockModifyHelperName)
              .returns(messageData);

          } else {
            expect.fail(`could not parse blockModifyHelper from: ${messageData.blockModifyHelper}`);
          }

          const performBlockModifyHelperJoiRes = await sails.helpers.messageProcessor.performBlockModifyHelperJoi(params);

          expect(blockModifyHelperStub.callCount).to.be.eq(1);
          expect(performBlockModifyHelperJoiRes).to.deep.include(messageData);

        } catch (e) {
          expect.fail(`Unexpected error: \n${JSON.stringify(e, null, 3)}`);
        }

      });

    });

  });

});

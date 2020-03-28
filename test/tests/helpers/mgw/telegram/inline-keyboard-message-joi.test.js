"use strict";

const {expect} = require('chai');
const sinon = require('sinon');
const casual = require('casual');

describe('mgw:telegram:inlineKeyboardMessageJoi test', function () {

  let customConfig;
  let inlineKeyboard;

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;
    inlineKeyboard = [
      [
        {
          "text": "MSG_OPTIN_GENERAL_INFO_BTN_YES",
          "callback_data": "general_info_yes"
        }
      ],
      [
        {
          "text": "MSG_OPTIN_GENERAL_INFO_BTN_NO",
          "callback_data": "general_info_no"
        }
      ]
    ];
  });

  describe('Check input params', function () {

    it('should fail for missing "chatId" param', async () => {

      try {

        const params = {
          html: casual.word,
          inlineKeyboard,
        };

        await sails.helpers.mgw.telegram.inlineKeyboardMessageJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.deep.include({message: '"chatId" is required'});
      }

    });

    it ('should fail for missing "html" param', async () => {

      try {

        const params = {
          chatId: casual.word,
          inlineKeyboard,
        };

        await sails.helpers.mgw.telegram.inlineKeyboardMessageJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.deep.include({message: '"html" is required'});
      }

    });

    it ('should fail for missing "inlineKeyboard" param', async () => {

      try {

        const params = {
          chatId: casual.word,
          html: casual.word,
        };

        await sails.helpers.mgw.telegram.inlineKeyboardMessageJoi(params);
        expect.fail('Unexpected success');

      } catch (e) {
        expect(e.raw.payload.error).to.deep.include({message: '"inlineKeyboard" is required'});
      }

    });

  });

  describe('Call Telegram API sendMessage (inline_keyboard)', function () {

    let sendMessageStub;

    before(function () {
      sendMessageStub = sinon.stub(customConfig.telegramBot, 'sendMessage');
    });

    after(function () {
      sendMessageStub.restore();
    });

    it('should successfully call inlineKeyboardMessageJoi', async function () {

      sendMessageStub.returns('sendMessageStub (inline_keyboard) result');

      try {

        const params = {
          chatId: casual.word,
          html: casual.word,
          inlineKeyboard,
        };

        const inlineKeyboardMessageJoiRes = await sails.helpers.mgw.telegram.inlineKeyboardMessageJoi(params);

        expect(sendMessageStub.callCount).to.be.eq(1);
        expect(inlineKeyboardMessageJoiRes).to.deep.include({
          status: 'ok',
          message: 'Telegram inline keyboard message was sent',
          payload: 'sendMessageStub (inline_keyboard) result',
        });

      } catch (e) {
        expect.fail(`Unexpected error: \n${JSON.stringify(e, null, 3)}`);
      }

    });

  });

});

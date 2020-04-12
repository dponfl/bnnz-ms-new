"use strict";

const sleep = require('util').promisify(setTimeout);
const mlog = require('mocha-logger');
const moment = require('moment');
const sinon = require('sinon');

describe.skip('Test sleep function', function () {

  it('should make two logs with 3 sec delay', async function () {

    this.timeout(10000);
    mlog.log(`Start: ${moment().format()}`);
    await sleep(3000);
    mlog.log(`Finish: ${moment().format()}`);

  });

});

describe.skip('Test sendDocument', function () {

  let customConfig;

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;
  });

  it('should send one document', async function () {

    const client = await Client.findOne({
      guid: 'f079a758-a530-4c19-83fb-fca217c07639'
    });

    client.accounts = await Account.find({client: client.id});

    const chatId = client.chat_id;
    const html = 'Документ';
    const docPath = customConfig.cloudinaryImgUrl + 'v1586616265/CY_Tax_2019.pdf';

    const res = await sails.helpers.mgw.telegram.docMessageJoi({
      chatId,
      docPath,
      html,
    });

  });

});

describe('Test send few test text messages', function () {

  let customConfig;
  let messageSaveJoiStub;

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;

    messageSaveJoiStub = sinon.stub(sails.helpers.storage, 'messageSaveJoi');
  });

  after(function () {
    messageSaveJoiStub.restore();
  });

  it('should send few test messages', async function () {

    this.timeout(30000);

    const client = await Client.findOne({
      guid: 'f079a758-a530-4c19-83fb-fca217c07639'
    });

    client.accounts = await Account.find({client: client.id});

    client.funnels = {
      optin: [
        {
          "id": "step01",
          "description": "",
          "actionType": "text",
          "initial": true,
          "enabled": true,
          "show_time": 0,
          "previous": null,
          "next": "optin::step02",
          "switchToFunnel": null,
          "beforeHelper": null,
          "afterHelper": null,
          "forcedHelper": null,
          "callbackHelper": null,
          "blockModifyHelper": null,
          "shown": false,
          "done": false,
          "message": {
            "html": [
              {
                "text": "MSG_STEP01",
                "style": "",
                "cr": ""
              }
            ]
          }
        },
        {
          "id": "step02",
          "description": "",
          "actionType": "text",
          "initial": false,
          "enabled": false,
          "show_time": 2000,
          "previous": "optin::step01",
          "next": "optin::step03",
          "switchToFunnel": null,
          "beforeHelper": null,
          "afterHelper": null,
          "forcedHelper": null,
          "callbackHelper": null,
          "blockModifyHelper": null,
          "shown": false,
          "done": false,
          "message": {
            "html": [
              {
                "text": "MSG_STEP02",
                "style": "b",
                "cr": ""
              }
            ]
          }
        },
        {
          "id": "step03",
          "description": "",
          "actionType": "text",
          "initial": false,
          "enabled": false,
          "show_time": 5000,
          "previous": "optin::step02",
          "next": null,
          "switchToFunnel": null,
          "beforeHelper": null,
          "afterHelper": null,
          "forcedHelper": null,
          "callbackHelper": null,
          "blockModifyHelper": null,
          "shown": false,
          "done": false,
          "message": {
            "html": [
              {
                "text": "MSG_STEP03",
                "style": "i",
                "cr": ""
              }
            ]
          }
        },
      ]
    };

    const funnelName = 'optin';
    const blockId = 'step01';

    const res = await sails.helpers.funnel.proceedNextBlockJoi({
      client,
      funnelName,
      blockId,
    });

  });

});


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
    const docPath = customConfig.cloudinaryDocUrl + 'v1586616265/CY_Tax_2019.pdf';

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
  let clientUpdateJoiStub;

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;

    messageSaveJoiStub = sinon.stub(sails.helpers.storage, 'messageSaveJoi');
    clientUpdateJoiStub = sinon.stub(sails.helpers.storage, 'clientUpdateJoi');
  });

  after(function () {
    messageSaveJoiStub.restore();
    clientUpdateJoiStub.restore();
  });

  it('should send few test messages (different types with delays between them)', async function () {

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
          "next": "optin::step04",
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
        {
          "id": "step04",
          "description": "",
          "actionType": "doc",
          "initial": false,
          "enabled": false,
          "show_time": 3000,
          "previous": "optin::step03",
          "next": "optin::step05",
          "switchToFunnel": null,
          "beforeHelper": null,
          "afterHelper": null,
          "forcedHelper": null,
          "callbackHelper": null,
          "blockModifyHelper": null,
          "shown": false,
          "done": false,
          "message": {
            "doc": "v1586616265/CY_Tax_2019.pdf",
            "html": [
              {
                "text": "MSG_STEP04",
                "style": "b",
                "cr": ""
              }
            ]
          }
        },
        {
          "id": "step05",
          "description": "",
          "actionType": "text",
          "initial": false,
          "enabled": false,
          "show_time": 3000,
          "previous": "optin::step04",
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
                "text": "MSG_STEP05",
                "style": "",
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


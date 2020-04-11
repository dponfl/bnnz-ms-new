"use strict";

const sleep = require('util').promisify(setTimeout);
const mlog = require('mocha-logger');
const moment = require('moment');

describe.skip('Test sleep function', function () {

  it('should make two logs with 3 sec delay', async function () {

    this.timeout(10000);
    mlog.log(`Start: ${moment().format()}`);
    await sleep(3000);
    mlog.log(`Finish: ${moment().format()}`);

  });

});

describe('Test sendDocument', function () {

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

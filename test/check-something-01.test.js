"use strict";

const sleep = require('util').promisify(setTimeout);
const mlog = require('mocha-logger');
const moment = require('moment');
const sinon = require('sinon');

const clientSdk = require('./sdk/client');
const accountSdk = require('./sdk/account');


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

describe.skip('Test sendMessage', function () {

  let customConfig;

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;
  });

  it('should send one simple message', async function () {

    const client = await Client.findOne({
      guid: '4f71e0c9-26ae-4bfd-b633-2f353ae7fe26'
    });

    client.accounts = await Account.find({client: client.id});

    const chatId = client.chat_id;
    const html = `Это твой профиль в Instagram? https://www.facebook.com Ответь с помощью кнопок.`;

    const res = await sails.helpers.mgw.telegram.simpleMessageJoi({
      chatId,
      html,
    });

  });

  it('should send one simple message', async function () {

    const client = await Client.findOne({
      guid: '4f71e0c9-26ae-4bfd-b633-2f353ae7fe26'
    });

    client.accounts = await Account.find({client: client.id});

    const chatId = client.chat_id;
    const html = `Это твой профиль в Instagram? https://www.instagram.com/webstudiopro/?ref=123 Ответь с помощью кнопок.`;

    const res = await sails.helpers.mgw.telegram.simpleMessageJoi({
      chatId,
      html,
    });

  });

  it.skip('should send one simple message', async function () {

    const client = await Client.findOne({
      guid: '4f71e0c9-26ae-4bfd-b633-2f353ae7fe26'
    });

    client.accounts = await Account.find({client: client.id});

    const chatId = client.chat_id;
    const html = 'Задание поставить лайк для поста https://www.instagram.com/p/B7QmKU8FORo/?igshid=1t040901hzji4 выполнено. Спасибо';

    const res = await sails.helpers.mgw.telegram.simpleMessageJoi({
      chatId,
      html,
    });

  });

});

describe.skip('Test sendDocument with inline keyboard', function () {

  let customConfig;

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;
  });

  it('should send one document with inline keyboard', async function () {

    const client = await Client.findOne({
      guid: 'f079a758-a530-4c19-83fb-fca217c07639'
    });

    client.accounts = await Account.find({client: client.id});

    if (client.accounts.length === 0) {

      const account = await accountSdk.createAccountDB({
        client: client.id,
      });

      await clientSdk.updateClientDB(
        {
          guid: client.guid,
        },
        {
          account_use: account.guid,
        }
      );

      client.accounts = [account];
      client.account_use = client.accounts[0].guid;

    }

    const chatId = client.chat_id;
    const html = 'Документ';
    const inlineKeyboardRaw = [
      [
        {
          "text": "BEHERO_PAYMENT_ERROR_BTN_01",
          "callback_data": "make_payment"
        }
      ],
      [
        {
          "text": "BEHERO_PAYMENT_ERROR_BTN_02",
          "callback_data": "contact_support"
        }
      ]
    ];

    const inlineKeyboard = MessageProcessor.mapDeep({
      client: client,
      data: inlineKeyboardRaw,
    });

    const docPath = customConfig.cloudinaryDocUrl + 'v1586616265/CY_Tax_2019.pdf';

    const res = await sails.helpers.mgw.telegram.docMessageJoi({
      chatId,
      docPath,
      html,
      inlineKeyboard,
    });

  });

});

describe.skip('Test send few test text messages', function () {

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
          "next": "general::step04",
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
      ],
      general: [
        {
          "id": "step04",
          "description": "",
          "actionType": "doc",
          "initial": false,
          "enabled": false,
          "show_time": 3000,
          "previous": "optin::step03",
          "next": "general::step05",
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
          "previous": "general::step04",
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

describe.skip('Get account with null service', function () {

  it('should get account', async function () {

    const accountWithNotNullService = await Account.findOne({
      guid: '8e38e7c8-d57d-4356-b413-9c5b6983be11'
    }).populate('service');

    const accountWithNullService = await Account.findOne({
      guid: '71f87d7a-6fef-48ad-9ee9-f2fa4824e788'
    }).populate('service');

  });

});

describe.skip('Test sendInvoce', function () {

  let customConfig;
  let account;
  let client;

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;

    client = await Client.findOne({
      guid: 'f079a758-a530-4c19-83fb-fca217c07639'
    });

    if (client == null) {
      client = await clientSdk.createClientDB({
        chat_id: '372204823'
      });
    }

    account = await Account.findOne({
      guid: client.account_use
    });

    if (account == null) {
      account = await accountSdk.createAccountDB({
        client: client.id,
        guid: client.account_use,
      })
    }

    client.accounts = await Account.find({client: client.id});

  });

  it('should send invoice', async function () {

    try {

      const paymentProvider = customConfig.config.payments[client.messenger]['provider'].toLowerCase();

      const useLang = (_.has(customConfig.config.lang, client.lang) ? client.lang : 'ru');

      const priceConfigText = customConfig.config.lang[useLang].price;
      const priceConfigGeneral = customConfig.config.price;

      if (priceConfigText == null) {
        throw new Error(`Error: No text price config found: ${JSON.stringify(sails.config.custom.config.lang[useLang].price, null, 3)}`);
      }

      if (priceConfigGeneral == null) {
        throw new Error(`Error: No general price config found: ${JSON.stringify(sails.config.custom.config.price, null, 3)}`);
      }

      const title = MessageProcessor.parseStr({
        client,
        token: "BEHERO_MAKE_PAYMENT_PMT_TITLE",
      });

      const description = MessageProcessor.parseStr({
        client,
        token: "BEHERO_MAKE_PAYMENT_PMT_DESCRIPTION",
        additionalTokens: [
          {
            token: "$paymentPeriod$",
            value: priceConfigText.payment_periods.period_01,
          }
        ]
      });

      const currency = 'RUB';

      const paymentResultRaw = await sails.helpers.pgw[paymentProvider]['sendInvoiceJoi']({
        messenger: client.messenger,
        chatId: client.chat_id,
        title,
        description,
        startParameter: 'start',
        currency,
        prices: [
          {
            label: description,
            amount: _.toString(priceConfigGeneral[currency].silver_personal.period_01.current_price),
          }
        ],
        clientId: client.id,
        clientGuid: client.guid,
        accountGuid: client.account_use,
      });

    } catch (e) {
      mlog.error(`Error: ${JSON.stringify(e, null, 3)}`);
    }


  });

});

describe.skip('Ref system: link 20 accounts to ref system', function () {

  let customConfig;
  let accounts = [];
  let clients = [];

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;

    this.timeout(700000);

    /**
     * Создаём 20 клиентов по 1 аккаунту у каждого
     * при этом 3+2 клиент связаны по реферальной системе
     */

    for (let i=0; i<3; i++) {

      const clientParams = {
        ref_key: (i > 0) ? accounts[i-1].ref_key : null,
      };

      const client = await clientSdk.createClientDB(clientParams);

      const account = await accountSdk.createAccountDB({
        client: client.id,
        is_ref: true,
      });

      await clientSdk.updateClientDB(
        {
          guid: client.guid,
        },
        {
          account_use: account.guid,
        }
      );

      client.accounts = [account];

      clients.push(client);
      accounts.push(account);

    }

    for (let i=3; i<20; i++) {

      let client;

      if (i === 5 || i === 15) {
        client = await clientSdk.createClientDB({
          ref_key: accounts[2].ref_key
        });
      } else if (i === 7 || i === 10) {
        client = await clientSdk.createClientDB({
          ref_key: accounts[0].ref_key
        });
      } else {
        client = await clientSdk.createClientDB();
      }

      const account = await accountSdk.createAccountDB({
        client: client.id,
        is_ref: true,
      });

      await clientSdk.updateClientDB(
        {
          guid: client.guid,
        },
        {
          account_use: account.guid,
        }
      );

      client.accounts = [account];

      clients.push(client);
      accounts.push(account);

    }


  });

  it('should link accounts to ref system', async function () {

    this.timeout(700000);

    const linkedAccounts = [];

    try {

      for (let i = 0; i < 20; i++) {
        const linkAccountToRefRaw = await sails.helpers.ref.linkAccountToRefJoi({
          account: accounts[i],
        });

        linkedAccounts.push(linkAccountToRefRaw.payload);

      }

    } catch (e) {
      mlog.error(`Error: ${JSON.stringify(e, null, 3)}`);
    }


  });

});

describe('Check KeyboardProcessor methods & sendKeyboardJoi', function () {

  let customConfig;
  let client;

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;

    client = await Client.findOne({
      chat_id: '372204823'
    });

    client.accounts = await Account.find({client: client.id});

  });

  it.skip('parseButtonActions', async function () {

    const buttons = [
      [
        {
          "id": "btn_id_01",
          "text": "TEST_BTN_01",
          "action": "main::actionForButton01"
        }
      ],
      [
        {
          "id": "btn_id_02",
          "text": "TEST_BTN_02",
          "action": "main::actionForButton02"
        }
      ],
      [
        {
          "id": "btn_id_03",
          "text": "TEST_BTN_03",
          "action": "main::actionForButton03"
        },
        {
          "id": "btn_id_04",
          "text": "TEST_BTN_04",
          "action": "main::actionForButton04"
        }
      ],
      [
        {
          "id": "btn_id_05",
          "text": "TEST_BTN_05",
          "action": "main::actionForButton05"
        }
      ],
    ];

    try {

      const res = KeyboardProcessor.parseButtonActions({
        client,
        buttons,
      });

      // const res = _.flattenDeep(buttons);

      mlog.success(`Result:
      ${JSON.stringify(res, null, 3)}`);

    } catch (e) {
      mlog.error(`Error: ${JSON.stringify(e, null, 3)}`);
    }


  });

  it.skip('mapButtonsDeep', async function () {

    const buttons = [
      [
        {
          "id": "btn_id_01",
          "text": "TEST_BTN_01",
          "action": "main::actionForButton01"
        }
      ],
      [
        {
          "id": "btn_id_02",
          "text": "TEST_BTN_02",
          "action": "main::actionForButton02"
        }
      ],
      [
        {
          "id": "btn_id_03",
          "text": "TEST_BTN_03",
          "action": "main::actionForButton03"
        },
        {
          "id": "btn_id_04",
          "text": "TEST_BTN_04",
          "action": "main::actionForButton04"
        }
      ],
      [
        {
          "id": "btn_id_05",
          "text": "TEST_BTN_05",
          "action": "main::actionForButton05"
        }
      ],
    ];

    try {

      const res = KeyboardProcessor.mapButtonsDeep({
        client,
        buttons,
      });

      mlog.success(`Result:
      ${JSON.stringify(res, null, 3)}`);

    } catch (e) {
      mlog.error(`Error: ${JSON.stringify(e, null, 3)}`);
    }


  });

  it.skip('keyboardMessageJoi', async function () {

    const buttonsObj = [
      [
        {
          "id": "btn_id_01",
          "text": "TEST_BTN_01",
          "action": "main::actionForButton01"
        }
      ],
      [
        {
          "id": "btn_id_02",
          "text": "TEST_BTN_02",
          "action": "main::actionForButton02"
        }
      ],
      [
        {
          "id": "btn_id_03",
          "text": "TEST_BTN_03",
          "action": "main::actionForButton03"
        },
        {
          "id": "btn_id_04",
          "text": "TEST_BTN_04",
          "action": "main::actionForButton04"
        }
      ],
      [
        {
          "id": "btn_id_05",
          "text": "TEST_BTN_05",
          "action": "main::actionForButton05"
        }
      ],
    ];



    try {

      const buttons = KeyboardProcessor.mapButtonsDeep({
        client,
        buttons: buttonsObj,
      });

      const res = await sails.helpers.mgw.telegram.keyboardMessageJoi({
        chatId: client.chat_id,
        html: "Some message here...",
        keyboard: buttons,
      });

      mlog.success(`Result:
      ${JSON.stringify(res, null, 3)}`);

    } catch (e) {
      mlog.error(`Error: ${JSON.stringify(e, null, 3)}`);
    }


  });

  it('sendKeyboardJoi', async function () {

    const keyboardObj = {
      "id": "keyboard_id",
      "description": "XXX",
      "initial": true,
      "enabled": false,
      "previous": null,
      "next": null,
      "message": {
        "html": [
          {
            "text": "TEST_BTN_05",
            "style": "bi",
            "cr": "DCR"
          },
          {
            "text": "TEST_BTN_04",
            "style": "",
            "cr": ""
          }
        ]
      },
      "buttons": [
        [
          {
            "id": "btn_id_01",
            "text": "TEST_BTN_01",
            "action": "main::actionForButton01"
          }
        ],
        [
          {
            "id": "btn_id_02",
            "text": "TEST_BTN_02",
            "action": "main::actionForButton02"
          }
        ],
        [
          {
            "id": "btn_id_03",
            "text": "TEST_BTN_03",
            "action": "main::actionForButton03"
          },
          {
            "id": "btn_id_04",
            "text": "TEST_BTN_04",
            "action": "main::actionForButton04"
          }
        ],
        [
          {
            "id": "btn_id_05",
            "text": "TEST_BTN_05",
            "action": "main::actionForButton05"
          }
        ],
      ]
    };

    try {

      const res = await sails.helpers.keyboardProcessor.sendKeyboardJoi({
        client,
        messageData: keyboardObj.message,
        keyboardData: keyboardObj.buttons,
      });

      mlog.success(`Result:
      ${JSON.stringify(res, null, 3)}`);

    } catch (e) {
      mlog.error(`Error: ${JSON.stringify(e, null, 3)}`);
    }


  });

});



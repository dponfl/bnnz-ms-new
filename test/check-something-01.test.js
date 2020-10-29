"use strict";

const sleep = require('util').promisify(setTimeout);
const mlog = require('mocha-logger');
const moment = require('moment');

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');

const emoji = require('node-emoji');

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
      guid: 'f079a758-a530-4c19-83fb-fca217c07639'
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

describe.skip('Test emoji', function () {

  let customConfig;

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;
  });

  it('should send one simple message with emoji', async function () {

    let html =
`
Проверка отображения emoji:
- wave :wave:
- point_right :point_right:
- point_left :point_left:
- robot :robot:
- rocket :rocket:
- wink :wink:
- eyes :eyes:
- boom :boom:
- dart :dart:
- point_down :point_down:
- calling :calling:
- white_check_mark :white_check_mark:
- speech_balloon :speech_balloon:
- heart :heart:
- inbox_tray :inbox_tray:
- recycle :recycle:
- crown :crown:
- mortar_board :mortar_board:
- sunrise :sunrise:
- busts_in_silhouette :busts_in_silhouette:
- sunglasses :sunglasses:
- link :link:
- credit_card :credit_card:
- hash :hash:
- man_technologist :man_technologist:
- mag :mag:
- star :star:
- speaking_head_in_silhouette :speaking_head_in_silhouette:
- soon :soon:
- chart_with_upwards_trend :chart_with_upwards_trend:
- heart_eyes :heart_eyes:
- woman_artist :woman_artist:
- art :art:
- wastebasket :wastebasket:
- scales :scales:
- camera_with_flash :camera_with_flash:
- cool :cool:
- boom :boom:
- clock3 :clock3:
`;

    html = emoji.emojify(html, () => '');

    const chatId = '372204823';

    const res = await sails.helpers.mgw.telegram.simpleMessageJoi({
      chatId,
      html,
    });

  });

});

describe.skip('Test sendSticker', function () {

  let customConfig;

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;
  });

  it('should send one sticker message', async function () {

    const client = await Client.findOne({
      guid: 'c7be56f8-d293-4d3d-9606-93144a33e1d9'
    });

    client.accounts = await Account.find({client: client.id});

    const chatId = client.chat_id;
    const stickerPath = customConfig.cloudinaryImgUrl + `befame_sticker.webp`;

    const res = await sails.helpers.mgw.telegram.stickerMessageJoi({
      chatId,
      stickerPath,
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
          "text": "COMMON_PAYMENT_ERROR_BTN_01",
          "callback_data": "make_payment"
        }
      ],
      [
        {
          "text": "COMMON_PAYMENT_ERROR_BTN_02",
          "callback_data": "contact_support"
        }
      ]
    ];

    const inlineKeyboard = await MessageProcessor.mapDeep({
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

describe.skip('Test sendPhoto with inline keyboard', function () {

  let customConfig;

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;
  });

  it('should send one img with inline keyboard', async function () {

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
    const html = 'Красивая картинка)';
    const inlineKeyboardRaw = [
      [
        {
          "text": "COMMON_CONFIRM_PROFILE_BTN_YES",
          "callback_data": "yes"
        }
      ],
      [
        {
          "text": "COMMON_CONFIRM_PROFILE_BTN_NO",
          "callback_data": "no"
        }
      ]
    ];

    const inlineKeyboard = await MessageProcessor.mapDeep({
      client: client,
      data: inlineKeyboardRaw,
    });

    const imgPath = customConfig.cloudinaryImgUrl + 'v1549212141/sample.jpg';

    const res = await sails.helpers.mgw.telegram.imgMessageJoi({
      chatId,
      imgPath,
      html,
      inlineKeyboard,
    });

  });

});

describe.skip('Test sendVideo with inline keyboard', function () {

  let customConfig;
  let client;

  before(async function () {

    this.timeout(700000);

    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;

    client = await Client.findOne({
      chat_id: '372204823'
    });

    client.accounts = await Account.find({client: client.id});

  });

  it('should send one video with inline keyboard', async function () {

    this.timeout(700000);

    const chatId = client.chat_id;

    // const videoPath = customConfig.cloudinaryVideoUrl + 'v1597401314/BeFame_Dev/INFO_How_Make_Post_v001_001.mp4';
    // const videoPath = customConfig.cloudinaryVideoUrl + 'v1597401420/BeFame_Dev/INFO_How_Perform_Task_v001_001.mp4';
    // const videoPath = './media/INFO_How_Perform_Task_v001_001.mp4';
    const videoPath = './media/INFO_How_Make_Post_v001_001.mp4';
    // const videoPath = 'BAACAgQAAxkDAAIKgV82xzYNE1aTNY_cKpfo6lqeD5QiAAIwBwAC3Ie5UbFY66eyWPS6GgQ';
    // const videoPath = 'BAACAgQAAxkDAAIKgl82yRQ9Z4TSDYoB8SlUI0VWbiv1AAIxBwAC3Ie5UWrU07Iv8NbJGgQ';

    let videoRes = await sails.helpers.mgw.telegram.videoMessageJoi({
      chatId,
      videoPath,
      html: 'Test big video having media type ...',
      fileOptions: {
        mime_type: "video/mp4",
        // supports_streaming: true,
      }
    });

    const ttt = 1;

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

      const title = await MessageProcessor.parseStr({
        client,
        token: "COMMON_MAKE_PAYMENT_PMT_TITLE",
      });

      const description = await MessageProcessor.parseStr({
        client,
        token: "COMMON_MAKE_PAYMENT_PMT_DESCRIPTION",
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

describe.skip('Ref system: link 2 accounts to ref system', function () {

  let customConfig;
  let accounts = [];
  let clients = [];

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;

    this.timeout(700000);

    /**
     * Создаём 2 клиентов по 1 аккаунту у каждого
     */

    for (let i=0; i<2; i++) {

      const client = await clientSdk.createClientDB();

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

      for (let i = 0; i < 2; i++) {
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

describe.skip('Ref system: link 1 accounts to ref system', function () {

  let customConfig;
  let accounts = [];
  let clients = [];

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;

    this.timeout(700000);

    /**
     * Создаём 1 клиентов по 1 аккаунту у каждого
     */

    for (let i=0; i<1; i++) {

      const client = await clientSdk.createClientDB();

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

      for (let i = 0; i < 1; i++) {
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

describe.skip('Check KeyboardProcessor methods & sendKeyboardJoi', function () {

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

      const res = await KeyboardProcessor.parseButtonActions({
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

      const res = await KeyboardProcessor.mapButtonsDeep({
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

      const buttons = await KeyboardProcessor.mapButtonsDeep({
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

  it.skip('sendKeyboardJoi', async function () {

    this.timeout(10000);

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

    const keyboardObj01 = {
      "id": "keyboard_id",
      "description": "XXX",
      "initial": true,
      "enabled": false,
      "previous": null,
      "next": null,
      "message": {
        "html": [
          {
            "text": "COMMON_JOIN_REF_NO_INTEREST_02",
            "style": "bi",
            "cr": "DCR"
          },
        ]
      },
      "buttons": [
        [
          {
            "id": "btn_id_01",
            "text": "COMMON_JOIN_REF_NO_INTEREST_BTN_01",
            "action": "main::actionForButton01"
          }
        ],
        [
          {
            "id": "btn_id_02",
            "text": "COMMON_JOIN_REF_NO_INTEREST_BTN_02",
            "action": "main::actionForButton02"
          }
        ],
      ]
    };

    const keyboardObj02 = {
      "id": "keyboard_id",
      "description": "XXX",
      "initial": true,
      "enabled": false,
      "previous": null,
      "next": null,
      "message": {
        "html": [
          {
            "text": "COMMON_JOIN_REF_MORE_INFO_SECOND",
            "style": "bi",
            "cr": "DCR"
          },
        ]
      },
      "buttons": [
        [
          {
            "id": "btn_id_01",
            "text": "COMMON_JOIN_REF_NO_INTEREST_BTN_01",
            "action": "main::actionForButton01"
          }
        ],
        [
          {
            "id": "btn_id_02",
            "text": "COMMON_JOIN_REF_NO_INTEREST_BTN_02",
            "action": "main::actionForButton02"
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

      await sleep(3000);

      const res01 = await sails.helpers.keyboardProcessor.removeKeyboardJoi({
        client,
        messageData: keyboardObj01.message,
      });

      await sleep(3000);

      const res02 = await sails.helpers.keyboardProcessor.sendKeyboardJoi({
        client,
        messageData: keyboardObj02.message,
        keyboardData: keyboardObj02.buttons,
      });

      mlog.success(`Result:
      ${JSON.stringify(res, null, 3)}`);

      mlog.success(`Result:
      ${JSON.stringify(res02, null, 3)}`);

    } catch (e) {
      mlog.error(`Error: ${JSON.stringify(e, null, 3)}`);
    }


  });

});

describe.skip('Inapi requests', function () {

  let customConfig;
  let account;
  let client;

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;

    this.timeout(700000);

    client = await clientSdk.createClientDB();

    account = await accountSdk.createAccountDB({
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

  });

  it.skip('Check request result: getLimitsJoi', async function () {

    this.timeout(30000);

    const res = await sails.helpers.parsers.inst.inapi.getLimitsJoi();
    mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
  });

  it.skip('Check request result: getUserIdByProfileJoi', async function () {

    this.timeout(30000);

    const params = {
      instProfile: 'dima_ponomarev1',
      client,
    };
    const res = await sails.helpers.parsers.inst.inapi.getUserIdByProfileJoi(params);
    mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
  });

  it.skip('Check request result: checkProfileExistsJoi', async function () {

    this.timeout(30000);

    const params = {
      instProfile: 'dima_ponomarev1',
      client,
    };
    const res = await sails.helpers.parsers.inst.inapi.checkProfileExistsJoi(params);
    mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
  });

  it.skip('Check request result: getFollowingsJoi', async function () {

    this.timeout(30000);

    const params = {
      client,
      profilePk: '434396103',
      limit: 1,
    };
    const res = await sails.helpers.parsers.inst.inapi.getFollowingsJoi(params);
    mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
  });

  it.skip('Check request result: get necessary data from response', async function () {

    this.timeout(30000);

    const response = {
      "status": "success",
      "request_id": 5446,
      "response": {
        "status": "success",
        "instagram": {
          "after": "QVFCN2dxWThzZFYzV2o0Nm9EM1dudlRnSGZMNFVReU1uc3pPc3E0N3hUZU10dmc1dUVCcmJfb21qcmRoQnEycVZnM3NJMkVNMklfMnhxazREZGZkZlhVcQ==",
          "result": {
            "users": [
              {
                "id": "10173213865",
                "username": "k_samorazvitie",
                "full_name": "Саморазвитие и бизнес",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/84351952_628032651360127_208150174046879744_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=n42QWiujfO0AX9jFVPu&oh=9b59277bdf3941f5820a4b7ecc45f721&oe=5F34F2CE",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "10173213865",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 1594481678,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "10173213865",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/84351952_628032651360127_208150174046879744_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=n42QWiujfO0AX9jFVPu&oh=9b59277bdf3941f5820a4b7ecc45f721&oe=5F34F2CE",
                    "username": "k_samorazvitie"
                  }
                }
              },
              {
                "id": "38329190010",
                "username": "kofemanus_shikaren",
                "full_name": "Kofemanus_Shikaren",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/107457620_220824872312670_3789975521838697333_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=hnRMF-QeQhYAX8dV1uw&oh=f5ec43930e88981b96e87dc0a40ca608&oe=5F31F764",
                "is_private": true,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "38329190010",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": null,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "38329190010",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/107457620_220824872312670_3789975521838697333_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=hnRMF-QeQhYAX8dV1uw&oh=f5ec43930e88981b96e87dc0a40ca608&oe=5F31F764",
                    "username": "kofemanus_shikaren"
                  }
                }
              },
              {
                "id": "5520501814",
                "username": "stride_up",
                "full_name": "БИЗНЕС|МОТИВАЦИЯ|SMM",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/73393255_2518347405061572_424719480426332160_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=VfAqEOHOvF4AX9RcBK4&oh=c16fcae6655a8b70c654d66e152f6ea2&oe=5F318D7D",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "5520501814",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 0,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "5520501814",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/73393255_2518347405061572_424719480426332160_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=VfAqEOHOvF4AX9RcBK4&oh=c16fcae6655a8b70c654d66e152f6ea2&oe=5F318D7D",
                    "username": "stride_up"
                  }
                }
              },
              {
                "id": "17766418485",
                "username": "a_tikhonov77",
                "full_name": "Alexander Tikhonov",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/70266844_479154359481691_471213055456313344_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=0fBlWHPOACgAX-NVHI9&oh=b6b068e149e12524d9cd96d8578be86a&oe=5F3366D5",
                "is_private": true,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "17766418485",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": null,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "17766418485",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/70266844_479154359481691_471213055456313344_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=0fBlWHPOACgAX-NVHI9&oh=b6b068e149e12524d9cd96d8578be86a&oe=5F3366D5",
                    "username": "a_tikhonov77"
                  }
                }
              },
              {
                "id": "298218216",
                "username": "irina__mironova",
                "full_name": "Irina Mironova",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/81280329_222382225433386_4003031389569024000_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=vB8SPFa1eDwAX9zhJbW&oh=cf6c242b99ae84539743265292e35c1e&oe=5F3567F2",
                "is_private": true,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "298218216",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": null,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "298218216",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/81280329_222382225433386_4003031389569024000_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=vB8SPFa1eDwAX9zhJbW&oh=cf6c242b99ae84539743265292e35c1e&oe=5F3567F2",
                    "username": "irina__mironova"
                  }
                }
              },
              {
                "id": "671447165",
                "username": "alexandrataranova",
                "full_name": "💁🏼‍♀️АЛЕКСАНДРА ТАРАНОВА💄",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/104300794_3055637914517390_3511545005075976810_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=WNley_olxJYAX9msQkV&oh=f60edb036a3a42ba229f5e17fc267caf&oe=5F33CFDF",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "671447165",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 0,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "671447165",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/104300794_3055637914517390_3511545005075976810_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=WNley_olxJYAX9msQkV&oh=f60edb036a3a42ba229f5e17fc267caf&oe=5F33CFDF",
                    "username": "alexandrataranova"
                  }
                }
              },
              {
                "id": "1597277038",
                "username": "giovanni_sonches",
                "full_name": "👼🏻 𝚂𝙾𝙽𝙲𝙷𝙴𝚂 🍼",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/103394284_722353261856253_3008866275267088577_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=GkBueGUQs6EAX9t1Pe1&oh=67d0e172916f9eba286bd4cb11ef163f&oe=5F318F15",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "1597277038",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 0,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "1597277038",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/103394284_722353261856253_3008866275267088577_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=GkBueGUQs6EAX9t1Pe1&oh=67d0e172916f9eba286bd4cb11ef163f&oe=5F318F15",
                    "username": "giovanni_sonches"
                  }
                }
              },
              {
                "id": "1292500442",
                "username": "milla_paan",
                "full_name": "MILA PAN 🌱MP",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/70357315_396120557714350_6805820591879225344_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=5x0lfhAdKV8AX-sUaDZ&oh=ab89d16c3c5e10ea23d62f0159ce766e&oe=5F351243",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "1292500442",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 1594484743,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "1292500442",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/70357315_396120557714350_6805820591879225344_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=5x0lfhAdKV8AX-sUaDZ&oh=ab89d16c3c5e10ea23d62f0159ce766e&oe=5F351243",
                    "username": "milla_paan"
                  }
                }
              },
              {
                "id": "1032078844",
                "username": "vera_iva",
                "full_name": "V E R A  I V A N O V A🐆",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/83494720_895053654243599_7439506277253775360_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=rD0tH_ihc0cAX9VBv3S&oh=274b58f8839c67966f90d7ec53636c0b&oe=5F334B61",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "1032078844",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 1594490553,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "1032078844",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/83494720_895053654243599_7439506277253775360_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=rD0tH_ihc0cAX9VBv3S&oh=274b58f8839c67966f90d7ec53636c0b&oe=5F334B61",
                    "username": "vera_iva"
                  }
                }
              },
              {
                "id": "5621119610",
                "username": "ange.rus",
                "full_name": "Angelina🖤",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/106247561_282910156124130_5611307739286150633_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=Ho687Zv_FNcAX_89uwB&oh=24334d6106c9481cd6d7a399a0c841c9&oe=5F31CA1F",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "5621119610",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 1594485350,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "5621119610",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/106247561_282910156124130_5611307739286150633_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=Ho687Zv_FNcAX_89uwB&oh=24334d6106c9481cd6d7a399a0c841c9&oe=5F31CA1F",
                    "username": "ange.rus"
                  }
                }
              },
              {
                "id": "32434115919",
                "username": "johnpr104",
                "full_name": "johnpr10",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/91020536_1058695144493934_7582675593271967744_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=rU9ejE3qDDQAX8ccmTc&oh=fe5eaf9f6e1c60ceef7dcbc247b49ad2&oe=5F3471C6",
                "is_private": true,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "32434115919",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": null,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "32434115919",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/91020536_1058695144493934_7582675593271967744_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=rU9ejE3qDDQAX8ccmTc&oh=fe5eaf9f6e1c60ceef7dcbc247b49ad2&oe=5F3471C6",
                    "username": "johnpr104"
                  }
                }
              },
              {
                "id": "389753229",
                "username": "_zuzu_official",
                "full_name": "ZuZu",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/74924897_548460629220086_9149650551011540992_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=o4ZoeNxY-PEAX-UFGcZ&oh=7eeca318bccc7afb704d6bbde3f386bc&oe=5F321992",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "389753229",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 1594463854,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "389753229",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/74924897_548460629220086_9149650551011540992_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=o4ZoeNxY-PEAX-UFGcZ&oh=7eeca318bccc7afb704d6bbde3f386bc&oe=5F321992",
                    "username": "_zuzu_official"
                  }
                }
              },
              {
                "id": "27401281439",
                "username": "sale.gid",
                "full_name": "Сервис умных покупок",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/104230398_586401311984405_4591487830499833495_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=ym1WjQuoKtEAX_hMoUN&oh=adb93cc99fcda4b8775495c56492a50c&oe=5F330F4B",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "27401281439",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 0,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "27401281439",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/104230398_586401311984405_4591487830499833495_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=ym1WjQuoKtEAX_hMoUN&oh=adb93cc99fcda4b8775495c56492a50c&oe=5F330F4B",
                    "username": "sale.gid"
                  }
                }
              },
              {
                "id": "345001744",
                "username": "teoduconte",
                "full_name": "Bogdan",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/11325952_864934603621981_70919300_a.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=xlL3zslKQpsAX-e4hqh&oh=c283220f4fcf0d05dcf9be9709bc5861&oe=5F3203A2",
                "is_private": true,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "345001744",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": null,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "345001744",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/11325952_864934603621981_70919300_a.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=xlL3zslKQpsAX-e4hqh&oh=c283220f4fcf0d05dcf9be9709bc5861&oe=5F3203A2",
                    "username": "teoduconte"
                  }
                }
              },
              {
                "id": "7125325489",
                "username": "natalee.007",
                "full_name": "Natasha",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/57775440_531362450722592_6004903379808026624_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=mNpE5OAJBGUAX_0fWDq&oh=4eb20d26a5df9b592d3d91ecdfdda0e5&oe=5F32C57C",
                "is_private": false,
                "is_verified": true,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "7125325489",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 1594480819,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "7125325489",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/57775440_531362450722592_6004903379808026624_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=mNpE5OAJBGUAX_0fWDq&oh=4eb20d26a5df9b592d3d91ecdfdda0e5&oe=5F32C57C",
                    "username": "natalee.007"
                  }
                }
              },
              {
                "id": "1615508948",
                "username": "m8world",
                "full_name": "M8 🌎",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/18382686_122857684948860_6503171422104322048_a.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=xC1OIUmDCXcAX_hqnob&oh=7fc935a6e3c71b8c1cb720482575fbfc&oe=5F3380CD",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "1615508948",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 0,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "1615508948",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/18382686_122857684948860_6503171422104322048_a.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=xC1OIUmDCXcAX_hqnob&oh=7fc935a6e3c71b8c1cb720482575fbfc&oe=5F3380CD",
                    "username": "m8world"
                  }
                }
              },
              {
                "id": "1552018577",
                "username": "foodwithzen",
                "full_name": "Food With Zen",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/89438588_2726604887578284_7951028790488989696_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=zTGn9ogvGpUAX9Ad1Je&oh=0a0df562df44df02ef2c4d23566ab28d&oe=5F32C95F",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "1552018577",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 0,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "1552018577",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/89438588_2726604887578284_7951028790488989696_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=zTGn9ogvGpUAX9Ad1Je&oh=0a0df562df44df02ef2c4d23566ab28d&oe=5F32C95F",
                    "username": "foodwithzen"
                  }
                }
              },
              {
                "id": "3648394920",
                "username": "auroramy_",
                "full_name": "Anastasia Romanova🍒",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/106503955_710267786425773_1063998608828999119_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=y7_QYaIG9coAX-GfB_p&oh=47d326160d13a3d6c45b617477bfe95d&oe=5F3363BA",
                "is_private": true,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "3648394920",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": null,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "3648394920",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/106503955_710267786425773_1063998608828999119_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=y7_QYaIG9coAX-GfB_p&oh=47d326160d13a3d6c45b617477bfe95d&oe=5F3363BA",
                    "username": "auroramy_"
                  }
                }
              },
              {
                "id": "232080053",
                "username": "alinashirokova",
                "full_name": "e s   a d i c t i v o",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/105969051_267343438046253_177242238750609649_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=6tcVuv2-u6YAX-JkS5E&oh=c96b73de371448bc4b5511c8710dd869&oe=5F34858B",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "232080053",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 0,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "232080053",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/105969051_267343438046253_177242238750609649_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=6tcVuv2-u6YAX-JkS5E&oh=c96b73de371448bc4b5511c8710dd869&oe=5F34858B",
                    "username": "alinashirokova"
                  }
                }
              },
              {
                "id": "649291681",
                "username": "oks1_",
                "full_name": "Ｌｉｆｅ| M  o  m  e  n  t ‘ s",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/106208195_2622412161195487_5131196275822613088_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=SdHSd7qj6zAAX_Ncv-8&oh=23babec87165fc2e813ac145bc0c3580&oe=5F327C0D",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "649291681",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 1594488169,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "649291681",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/106208195_2622412161195487_5131196275822613088_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=SdHSd7qj6zAAX_Ncv-8&oh=23babec87165fc2e813ac145bc0c3580&oe=5F327C0D",
                    "username": "oks1_"
                  }
                }
              },
              {
                "id": "25858289113",
                "username": "kulikovskaya131313",
                "full_name": "Martinez Mexico",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/104169141_317062169309384_7815691716273743610_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=7ZE_PVmzzO0AX_ryvC-&oh=c1a35d08b7e255c04eaef26acaf79707&oe=5F31FAE9",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "25858289113",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 1594464200,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "25858289113",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/104169141_317062169309384_7815691716273743610_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=7ZE_PVmzzO0AX_ryvC-&oh=c1a35d08b7e255c04eaef26acaf79707&oe=5F31FAE9",
                    "username": "kulikovskaya131313"
                  }
                }
              },
              {
                "id": "23320558730",
                "username": "miss_antikriz",
                "full_name": "Venkon",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/98284584_1552958881533141_8418837027801268224_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=adkOrwEi7lMAX8jNgYw&oh=8a465ccbdbe7cba6650c1f2187231211&oe=5F3316D6",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "23320558730",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 1594408367,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "23320558730",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/98284584_1552958881533141_8418837027801268224_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=adkOrwEi7lMAX8jNgYw&oh=8a465ccbdbe7cba6650c1f2187231211&oe=5F3316D6",
                    "username": "miss_antikriz"
                  }
                }
              },
              {
                "id": "356241088",
                "username": "apple_portal",
                "full_name": "Портал Apple",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/54463864_506134356585559_3556194433886060544_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=TQaCKnGy6kcAX-BPNOQ&oh=0e0b96588a2edc53324edc21fccab75f&oe=5F31B492",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "356241088",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 1594476122,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "356241088",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/54463864_506134356585559_3556194433886060544_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=TQaCKnGy6kcAX-BPNOQ&oh=0e0b96588a2edc53324edc21fccab75f&oe=5F31B492",
                    "username": "apple_portal"
                  }
                }
              },
              {
                "id": "25104199253",
                "username": "jasperproff007",
                "full_name": "Тёма",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/75588046_2530269750426671_3214115926735585280_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=c6YT_TjfzKgAX8X-yCV&oh=9bcefc3b27a73ee9bd30a1dd6f9c7a35&oe=5F31A713",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "25104199253",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 1594404273,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "25104199253",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/75588046_2530269750426671_3214115926735585280_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=c6YT_TjfzKgAX8X-yCV&oh=9bcefc3b27a73ee9bd30a1dd6f9c7a35&oe=5F31A713",
                    "username": "jasperproff007"
                  }
                }
              },
              {
                "id": "3923741146",
                "username": "missmary_7777",
                "full_name": "𝓜𝓪𝓻𝓲𝓪 𝓜𝓪𝓷𝔂𝓪𝓴",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/101492953_289367599120650_6723700529416896512_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=MyWrueEVowAAX-wm6Pw&oh=7570b919b92753138a80aaa61084498c&oe=5F332CF7",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "3923741146",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 1594471333,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "3923741146",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/101492953_289367599120650_6723700529416896512_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=MyWrueEVowAAX-wm6Pw&oh=7570b919b92753138a80aaa61084498c&oe=5F332CF7",
                    "username": "missmary_7777"
                  }
                }
              },
              {
                "id": "1549200205",
                "username": "oll.lesya",
                "full_name": "L E S Y A 🕊💖",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/80007677_614826382391962_270952332605259776_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=uuFDsz3HQEEAX85giWy&oh=07f9a84282d77d91687f129f94e51d5a&oe=5F330058",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "1549200205",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 0,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "1549200205",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/80007677_614826382391962_270952332605259776_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=uuFDsz3HQEEAX85giWy&oh=07f9a84282d77d91687f129f94e51d5a&oe=5F330058",
                    "username": "oll.lesya"
                  }
                }
              },
              {
                "id": "1282987925",
                "username": "surmach_anastasia",
                "full_name": "🌺Anasteysha🌺",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/36774608_228314044461340_1553487690983276544_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=YD_-pxxxfQYAX9mH3_1&oh=ff5213e5c3a04fb3f74d7ce3f4df8d1c&oe=5F33A350",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "1282987925",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 1594472322,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "1282987925",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/36774608_228314044461340_1553487690983276544_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=YD_-pxxxfQYAX9mH3_1&oh=ff5213e5c3a04fb3f74d7ce3f4df8d1c&oe=5F33A350",
                    "username": "surmach_anastasia"
                  }
                }
              },
              {
                "id": "7196542563",
                "username": "tinagots",
                "full_name": "",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/79633494_583426825756620_6211582244088184832_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=vYq_LwAzWpoAX9Uj_qx&oh=d34aa856cdd8b4245513b2e4f3456e46&oe=5F32E247",
                "is_private": true,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "7196542563",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": null,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "7196542563",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/79633494_583426825756620_6211582244088184832_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=vYq_LwAzWpoAX9Uj_qx&oh=d34aa856cdd8b4245513b2e4f3456e46&oe=5F32E247",
                    "username": "tinagots"
                  }
                }
              },
              {
                "id": "1230951680",
                "username": "butcher_steak",
                "full_name": "",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/19985671_412610379134067_3572759195033796608_a.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=Zr6Qu-QYslkAX_9LU1k&oh=72c3533cdfa201ad597613a33f1b67e4&oe=5F34E120",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "1230951680",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 0,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "1230951680",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/19985671_412610379134067_3572759195033796608_a.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=Zr6Qu-QYslkAX_9LU1k&oh=72c3533cdfa201ad597613a33f1b67e4&oe=5F34E120",
                    "username": "butcher_steak"
                  }
                }
              },
              {
                "id": "408602521",
                "username": "nataliesng",
                "full_name": "👑SexyNatG👑",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/60477766_2367689210173971_3023250771262046208_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=7lc4aS2Lk18AX-MRxtP&oh=ba38c7139801d2e6d1dad48f64d0ceb6&oe=5F34D63D",
                "is_private": false,
                "is_verified": true,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "408602521",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 1594479008,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "408602521",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/60477766_2367689210173971_3023250771262046208_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=7lc4aS2Lk18AX-MRxtP&oh=ba38c7139801d2e6d1dad48f64d0ceb6&oe=5F34D63D",
                    "username": "nataliesng"
                  }
                }
              },
              {
                "id": "1469081951",
                "username": "sonofthe90s",
                "full_name": "⠀⠀⠀#сын90х👊🇷🇺BMW 🚗💨🚓",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/16464023_1634395053522424_5816417125115363328_a.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=m2sosglWuNcAX_d90NF&oh=c67563327abd90052c9be63200c9c930&oe=5F34101E",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "1469081951",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 0,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "1469081951",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/16464023_1634395053522424_5816417125115363328_a.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=m2sosglWuNcAX_d90NF&oh=c67563327abd90052c9be63200c9c930&oe=5F34101E",
                    "username": "sonofthe90s"
                  }
                }
              },
              {
                "id": "277981425",
                "username": "aleksey_sinitsyn_",
                "full_name": "•ALEKSEY SINITSYN•",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/67879901_537874820294279_2798271064218533888_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=IvFRl7pfNXoAX91gBTG&oh=5bba123139069fa30305eb793c87174c&oe=5F32BA53",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "277981425",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 0,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "277981425",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/67879901_537874820294279_2798271064218533888_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=IvFRl7pfNXoAX91gBTG&oh=5bba123139069fa30305eb793c87174c&oe=5F32BA53",
                    "username": "aleksey_sinitsyn_"
                  }
                }
              },
              {
                "id": "1472394178",
                "username": "summerlovesummerl",
                "full_name": "❤️ 𝔄𝔫𝔤𝔢𝔩𝔦𝔨𝔞❤️",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/103884268_2509418492642118_4931691434690618597_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=t7h4LAAFbJEAX-i8xOd&oh=0dd118142af1f576cfc769eaa2738934&oe=5F31FF1F",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "1472394178",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 0,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "1472394178",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/103884268_2509418492642118_4931691434690618597_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=t7h4LAAFbJEAX-i8xOd&oh=0dd118142af1f576cfc769eaa2738934&oe=5F31FF1F",
                    "username": "summerlovesummerl"
                  }
                }
              },
              {
                "id": "1439187567",
                "username": "alexa_stel",
                "full_name": "𝖠 𝖫 𝖤 𝖷 𝖠 𝖭 𝖣 𝖱 𝖠 🧿♋️",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/83608915_884790728617912_607652119066968064_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=0qOiewh-vykAX8uOTic&oh=53c7128098af3a06dde38679491721ba&oe=5F332496",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "1439187567",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 0,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "1439187567",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/83608915_884790728617912_607652119066968064_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=0qOiewh-vykAX8uOTic&oh=53c7128098af3a06dde38679491721ba&oe=5F332496",
                    "username": "alexa_stel"
                  }
                }
              },
              {
                "id": "21284733110",
                "username": "t.m_art_by",
                "full_name": "Интерьерная Живопись🎨Т.М.",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/69727610_520116062098004_661959644062679040_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=bLyGOGVoyoEAX_bR-mk&oh=95f5fa824334a3153acf48e80cbaaa1c&oe=5F3505B7",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "21284733110",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 0,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "21284733110",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/69727610_520116062098004_661959644062679040_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=bLyGOGVoyoEAX_bR-mk&oh=95f5fa824334a3153acf48e80cbaaa1c&oe=5F3505B7",
                    "username": "t.m_art_by"
                  }
                }
              },
              {
                "id": "1641568190",
                "username": "dasha__zlobina",
                "full_name": "Даша",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/22069805_1548813465176953_1947700950714023936_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=iVe9vs3IIxEAX-pjSjS&oh=250c82e2cf7eb911710192910a6c2473&oe=5F342ABF",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "1641568190",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 1594430531,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "1641568190",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/22069805_1548813465176953_1947700950714023936_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=iVe9vs3IIxEAX-pjSjS&oh=250c82e2cf7eb911710192910a6c2473&oe=5F342ABF",
                    "username": "dasha__zlobina"
                  }
                }
              },
              {
                "id": "336672114",
                "username": "katyazg",
                "full_name": "",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/82489104_2569928483129558_9030741022757355520_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=CZ3w3IWOW_8AX9xmRtl&oh=33aa40b4aa602115f212f3e02b9dea9b&oe=5F339463",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "336672114",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 1594430061,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "336672114",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/82489104_2569928483129558_9030741022757355520_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=CZ3w3IWOW_8AX9xmRtl&oh=33aa40b4aa602115f212f3e02b9dea9b&oe=5F339463",
                    "username": "katyazg"
                  }
                }
              },
              {
                "id": "1910136329",
                "username": "lanaa_del",
                "full_name": "Эльвина",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/103968227_263766301545230_8290472958071098320_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=8JdI_Jun57AAX8v9fwZ&oh=49c5d9394b3e11bd970219427fc813e9&oe=5F33D5DD",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "1910136329",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 1594483333,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "1910136329",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/103968227_263766301545230_8290472958071098320_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=8JdI_Jun57AAX8v9fwZ&oh=49c5d9394b3e11bd970219427fc813e9&oe=5F33D5DD",
                    "username": "lanaa_del"
                  }
                }
              },
              {
                "id": "6065520395",
                "username": "summerloveesummerl",
                "full_name": "Лика(РЕЗЕРВНЫЙ АКК)❤️",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/56266969_372434113485198_2676405078046277632_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=Azvw7H8h7BcAX9hb48N&oh=f548b4f563d2b6bd19a7420b9a74a4f9&oe=5F34FA78",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "6065520395",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 0,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "6065520395",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/56266969_372434113485198_2676405078046277632_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=Azvw7H8h7BcAX9hb48N&oh=f548b4f563d2b6bd19a7420b9a74a4f9&oe=5F34FA78",
                    "username": "summerloveesummerl"
                  }
                }
              },
              {
                "id": "3000833822",
                "username": "checks.co",
                "full_name": "Cash • Money • Motivation",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/90219535_678641256009676_2968576447469322240_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=gvvKzOQ3uQ8AX9Q_C7a&oh=77353e2ca0d380ca9f7b90ad630b0ae2&oe=5F335165",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "3000833822",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 0,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "3000833822",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/90219535_678641256009676_2968576447469322240_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=gvvKzOQ3uQ8AX9Q_C7a&oh=77353e2ca0d380ca9f7b90ad630b0ae2&oe=5F335165",
                    "username": "checks.co"
                  }
                }
              },
              {
                "id": "19461374522",
                "username": "sonyacat10_",
                "full_name": "софья попова",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/95017848_230791958255051_4031628664805261312_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=Do3cuqI5CVEAX81uV4_&oh=17d01dff6015e72a1d1e2155afa14cf5&oe=5F334123",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "19461374522",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 0,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "19461374522",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/95017848_230791958255051_4031628664805261312_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=Do3cuqI5CVEAX81uV4_&oh=17d01dff6015e72a1d1e2155afa14cf5&oe=5F334123",
                    "username": "sonyacat10_"
                  }
                }
              },
              {
                "id": "17211706904",
                "username": "beerl1nk",
                "full_name": "Beerlink Shop&Bar",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/66347423_591465121382127_806630665331146752_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=EY_6QZ226PQAX-Fzdjg&oh=50ce915010fbf7cd55d3c4b62b3898f4&oe=5F334A36",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "17211706904",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 0,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "17211706904",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/66347423_591465121382127_806630665331146752_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=EY_6QZ226PQAX-Fzdjg&oh=50ce915010fbf7cd55d3c4b62b3898f4&oe=5F334A36",
                    "username": "beerl1nk"
                  }
                }
              },
              {
                "id": "2164312486",
                "username": "mila_gorba4eva",
                "full_name": "Мила Горбачева",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/61475528_437777506790350_8188333473124057088_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=jAyGNf3TOiAAX8AICm6&oh=e2a034703b7d3070a77702b94345c2fe&oe=5F31F236",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "2164312486",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 0,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "2164312486",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/61475528_437777506790350_8188333473124057088_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=jAyGNf3TOiAAX8AICm6&oh=e2a034703b7d3070a77702b94345c2fe&oe=5F31F236",
                    "username": "mila_gorba4eva"
                  }
                }
              },
              {
                "id": "182378151",
                "username": "tsum_moscow",
                "full_name": "ЦУМ / TSUM",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/101029301_292202452172698_5940140212196737024_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=zbFAEGvHFsUAX-g-Wy9&oh=60e70801f7eca0501dd4fdffd70cdc13&oe=5F3228C3",
                "is_private": false,
                "is_verified": true,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "182378151",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 0,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "182378151",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/101029301_292202452172698_5940140212196737024_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=zbFAEGvHFsUAX-g-Wy9&oh=60e70801f7eca0501dd4fdffd70cdc13&oe=5F3228C3",
                    "username": "tsum_moscow"
                  }
                }
              },
              {
                "id": "3212000286",
                "username": "nadi._8",
                "full_name": "",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/106182237_597185787900628_8672464496677455091_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=1AKunl8N16YAX9WPvkZ&oh=a131aca2bab8f988cbfc1dbe80a0c6c7&oe=5F332008",
                "is_private": true,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "3212000286",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": null,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "3212000286",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/106182237_597185787900628_8672464496677455091_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=1AKunl8N16YAX9WPvkZ&oh=a131aca2bab8f988cbfc1dbe80a0c6c7&oe=5F332008",
                    "username": "nadi._8"
                  }
                }
              },
              {
                "id": "6850474433",
                "username": "sophia.crash",
                "full_name": "Sophia Krasheninnikova",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/104875959_702630047239384_2771978613576049294_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=hwBcYCBytuYAX-1onRR&oh=2680c3d766a0a2cdac39b9432f4e0242&oe=5F338000",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "6850474433",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 1594488929,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "6850474433",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/104875959_702630047239384_2771978613576049294_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=hwBcYCBytuYAX-1onRR&oh=2680c3d766a0a2cdac39b9432f4e0242&oe=5F338000",
                    "username": "sophia.crash"
                  }
                }
              },
              {
                "id": "332557585",
                "username": "elizaserge",
                "full_name": "Eliza",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/95001372_1157177651288076_1340321081034014720_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=gfXWNV0os-4AX-5hZD6&oh=298c679d6db8a37f32b6200be1a77075&oe=5F32D2F8",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "332557585",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 1594454296,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "332557585",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/95001372_1157177651288076_1340321081034014720_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=gfXWNV0os-4AX-5hZD6&oh=298c679d6db8a37f32b6200be1a77075&oe=5F32D2F8",
                    "username": "elizaserge"
                  }
                }
              },
              {
                "id": "217989611",
                "username": "555___player",
                "full_name": "🅰️555___Player",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/106247565_1566205723560468_8659414219200805439_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=kny9tfSvJK4AX_0layq&oh=555b51d31224b95836862e3b8189028a&oe=5F33B808",
                "is_private": true,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "217989611",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": null,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "217989611",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/106247565_1566205723560468_8659414219200805439_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=kny9tfSvJK4AX_0layq&oh=555b51d31224b95836862e3b8189028a&oe=5F33B808",
                    "username": "555___player"
                  }
                }
              },
              {
                "id": "16166723329",
                "username": "zakharova.a.v",
                "full_name": "Anastasia Zakharova",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/96752286_234150311333516_3895039333173821440_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=d-cWrp6kklMAX-cr5pY&oh=41b9095f2c1c4bfa52d71793ed30a356&oe=5F33BD47",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "16166723329",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 1594490339,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "16166723329",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/96752286_234150311333516_3895039333173821440_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=d-cWrp6kklMAX-cr5pY&oh=41b9095f2c1c4bfa52d71793ed30a356&oe=5F33BD47",
                    "username": "zakharova.a.v"
                  }
                }
              },
              {
                "id": "1413460648",
                "username": "victorymoroz",
                "full_name": "Виктория",
                "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/102434813_551394785557923_7482612714476651354_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=sBzFU_J3rC4AX-CxrwF&oh=ac99c2f5b318c4c78cfdf61055fdef71&oe=5F34BFC1",
                "is_private": false,
                "is_verified": false,
                "followed_by_viewer": false,
                "requested_by_viewer": false,
                "reel": {
                  "id": "1413460648",
                  "expiring_at": 1594577049,
                  "has_pride_media": false,
                  "latest_reel_media": 0,
                  "seen": null,
                  "owner": {
                    "__typename": "GraphUser",
                    "id": "1413460648",
                    "profile_pic_url": "https://scontent-arn2-2.cdninstagram.com/v/t51.2885-19/s150x150/102434813_551394785557923_7482612714476651354_n.jpg?_nc_ht=scontent-arn2-2.cdninstagram.com&_nc_ohc=sBzFU_J3rC4AX-CxrwF&oh=ac99c2f5b318c4c78cfdf61055fdef71&oe=5F34BFC1",
                    "username": "victorymoroz"
                  }
                }
              }
            ]
          }
        }
      },
      "message": "ok",
      "currentDomain": "api.inapi.io"
    };

    let res = [];

    _.forEach(response.response.instagram.result.users, (elem) => {
      res.push(elem.username)
    });

    mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
  });

  it.skip('Check request result: checkProfileSubscriptionJoi', async function () {

    this.timeout(300000);

    const params = {
      client,
      checkProfile: 'dima_ponomarev1',
      profileId: '434396103',
      profilesList: ['k_samorazvitie', 'bmwm_insta', 'sonofthe90s', 'victorymoroz', 'andreeasasu90'],
    };

    // const params = {
    //   client,
    //   checkProfile: 'dima_ponomarev1',
    //   profileId: '434396103',
    //   profilesList: ['k_samorazvitie', 'sonofthe90s'],
    // };

    const res = await sails.helpers.parsers.inst.inapi.checkProfileSubscriptionJoi(params);
    mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
  });

  it.skip('Check request result: getPostCodeJoi', async function () {

    this.timeout(30000);

    const params = {
      postLink: 'https://www.instagram.com/p/B7QmKU8FORo/',
    };

    const res = await sails.helpers.general.getPostCodeJoi(params);

    mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
  });

  it.skip('Check request result: getMediaIdJoi', async function () {

    this.timeout(300000);

    const params = {
      client,
      // shortCode: 'BpZS90LBOwq',
      shortCode: 'BpZS90LBOwq123',
    };

    const res = await sails.helpers.parsers.inst.inapi.getMediaIdJoi(params);
    mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
  });

  it.skip('Check request result: getLikesJoi', async function () {

    this.timeout(30000);

    const params = {
      client,
      mediaId: '1898632130658102314',
    };

    const res = await sails.helpers.parsers.inst.inapi.getLikesJoi(params);
    mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
  });

  it.skip('Check request result: checkLikesJoi', async function () {

    this.timeout(30000);

    // const params = {
    //   client,
    //   instProfile: 'some_profile_123',
    //   instPostCode: 'BpZS90LBOwq',
    // };

    const params = {
      client,
      instProfile: 'krasheniinniikova',
      instPostCode: 'BpZS90LBOwq',
    };

    const res = await sails.helpers.parsers.inst.inapi.checkLikesJoi(params);

    const likeDone = _.get(res, 'payload.likeMade', 'none');

    mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
  });

  it.skip('Check request result: getCommentsJoi', async function () {

    this.timeout(30000);

    const params = {
      client,
      mediaId: '1747317351232356320', // https://www.instagram.com/p/Bg_t9-OFL_g/
    };

    const res = await sails.helpers.parsers.inst.inapi.getCommentsJoi(params);
    mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
  });

  it.skip('Check request result: checkCommentsJoi', async function () {

    this.timeout(30000);

    // const params = {
    //   instProfile: 'some_profile_123',
    //   instPostCode: 'Bg_t9-OFL_g',
    // };

    // const params = {
    //   instProfile: 'mantis_ch',
    //   instPostCode: 'Bg_t9-OFL_g',
    // };

    // const params = {
    //   instProfile: 'ahshzgj',
    //   instPostCode: 'Bg_t9-OFL_g',
    // };

    // const params = {
    //   instProfile: '__yuliya_0927__',
    //   instPostCode: 'Bg_t9-OFL_g',
    // };

    const params = {
      client,
      instProfile: 'artemvast',
      instPostCode: 'BeQkuYDlTR8',
    };

    const res = await sails.helpers.parsers.inst.inapi.checkCommentsJoi(params);

    const commentDone = _.get(res, 'payload.commentMade', 'none');
    const commentText = _.get(res, 'payload.commentText', 'none');
    const numberOfWords = _.get(res, 'payload.numberOfWords', 0);

    mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
  });


});

describe('rapidApiLogicbuilder requests', function () {

  let customConfig;
  let account;
  let client;

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;

    this.timeout(700000);

    client = await clientSdk.createClientDB();

    account = await accountSdk.createAccountDB({
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

  });

  beforeEach(async function () {
    await sleep(1500);
  });

  it.skip('Check request result: getUserMetadataJoi (existing profile)', async function () {

    this.timeout(300000);

    const params = {
      instProfile: 'webstudiopro',
      // instProfile: 'lkwjflweou02934u32lwfw',
      client,
    };
    const res = await sails.helpers.parsers.inst.rapidApiLogicbuilder.getUserMetadataJoi(params);

    expect(res).to.have.property('status', 'success');
    expect(res).to.have.property('subStatus', customConfig.HTTP_STATUS_FOUND.message);
    expect(res.payload.userId).to.be.a('string');
    expect(res.payload).to.have.property('userName', params.instProfile);

    // expect(sendMessageJoiRes).to.deep.include({
    //   status: 'ok',
    //   message: 'Telegram simple message was sent',
    //   payload: 'some payload',
    // });

    // mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
  });

  it.skip('Check request result: getUserMetadataJoi (non-existing profile)', async function () {

    this.timeout(300000);

    const params = {
      instProfile: 'lkwjflweou02934u32lwfw',
      client,
    };
    const res = await sails.helpers.parsers.inst.rapidApiLogicbuilder.getUserMetadataJoi(params);

    expect(res).to.have.property('status', 'success');
    expect(res).to.have.property('subStatus', customConfig.HTTP_STATUS_NOT_FOUND.message);

    // mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
  });

  it.skip('Check request result: checkProfileExistsJoi', async function () {

    this.timeout(300000);

    const params = {
      instProfile: 'dima_ponomarev1',
      client,
    };
    const res = await sails.helpers.parsers.inst.rapidApiLogicbuilder.checkProfileExistsJoi(params);

    expect(res).to.have.property('status', 'success');
    expect(res.payload).to.have.property('profileExists', true);
    expect(res.payload.profileId).to.be.a('string');
    expect(res.payload).to.have.property('profileUserName', params.instProfile);

    // mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
  });

  it.skip('Check request result: getFollowingsJoi (one page)', async function () {

    this.timeout(300000);

    const params = {
      client,
      instProfile: 'webstudiopro',
    };
    const res = await sails.helpers.parsers.inst.rapidApiLogicbuilder.getFollowingsJoi(params);

    expect(res).to.have.property('status', 'success');
    expect(res).to.have.property('subStatus', customConfig.HTTP_STATUS_FOUND.message);
    expect(res.payload).to.have.property('users');
    expect(res.payload.users).to.be.a('array');

    expect(res.payload).to.have.property('count');
    expect(res.payload.count).to.be.a('number');
    expect(res.payload.count).to.be.eq(res.payload.users.length);

    expect(res.payload).to.have.property('has_more', false);
    expect(res.payload).to.have.property('end_cursor', null);

    // mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
  });

  it.skip('Check request result: getFollowingsJoi (several pages)', async function () {

    this.timeout(300000);

    /**
     * Get first page
     */

    const params = {
      client,
      instProfile: 'dima_ponomarev1',
    };
    const res = await sails.helpers.parsers.inst.rapidApiLogicbuilder.getFollowingsJoi(params);

    expect(res).to.have.property('status', 'success');
    expect(res).to.have.property('subStatus', customConfig.HTTP_STATUS_FOUND.message);
    expect(res.payload).to.have.property('users');
    expect(res.payload.users).to.be.a('array');

    expect(res.payload).to.have.property('count');
    expect(res.payload.count).to.be.a('number');

    expect(res.payload).to.have.property('has_more', true);
    expect(res.payload).to.have.property('end_cursor');
    expect(res.payload.end_cursor).to.be.a('string');

    /**
     * Get next page
     */

    const paramsNext = {
      client,
      instProfile: 'dima_ponomarev1',
      endCursor: res.payload.end_cursor,
    };

    const resNext = await sails.helpers.parsers.inst.rapidApiLogicbuilder.getFollowingsJoi(paramsNext);

    expect(resNext).to.have.property('status', 'success');
    expect(resNext).to.have.property('subStatus', customConfig.HTTP_STATUS_FOUND.message);
    expect(resNext.payload).to.have.property('users');
    expect(resNext.payload.users).to.be.a('array');

    expect(resNext.payload).to.have.property('count');
    expect(resNext.payload.count).to.be.a('number');

    expect(resNext.payload).to.have.property('has_more', true);
    expect(resNext.payload).to.have.property('end_cursor');
    expect(resNext.payload.end_cursor).to.be.a('string');

    // mlog.success(`resNext: ${JSON.stringify(resNext, null, 3)}`);
  });

  it.skip('Check request result: getFollowingsJoi (wrong profile)', async function () {

    this.timeout(300000);

    const params = {
      client,
      instProfile: 'dlkfjl3r3rwsdlksjfsdf',
    };
    const res = await sails.helpers.parsers.inst.rapidApiLogicbuilder.getFollowingsJoi(params);

    expect(res).to.have.property('status', 'success');
    expect(res).to.have.property('subStatus', customConfig.HTTP_STATUS_NOT_FOUND.message);

    // mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
  });

  it.skip('Check request result: checkProfileSubscriptionJoi (all subscribed)', async function () {

    this.timeout(300000);

    const params = {
      client,
      checkProfile: 'dima_ponomarev1',
      profileId: '434396103',
      profilesList: ['k_samorazvitie', 'sonofthe90s', 'andreeasasu90'],
    };

    const res = await sails.helpers.parsers.inst.rapidApiLogicbuilder.checkProfileSubscriptionJoi(params);

    expect(res).to.have.property('status', 'success');
    expect(res.payload).to.have.property('allSubscribed', true);
    expect(res.payload).to.have.property('notSubscribed');
    expect(res.payload).to.have.property('subscribed');
    expect(res.payload.subscribed).to.be.a('array');
    expect(res.payload.subscribed.length).to.be.eq(3);
    expect(res.payload.notSubscribed.length).to.be.eq(0);

    // mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
  });

  it.skip('Check request result: checkProfileSubscriptionJoi (not all subscribed)', async function () {

    this.timeout(300000);

    const params = {
      client,
      checkProfile: 'dima_ponomarev1',
      profileId: '434396103',
      profilesList: ['k_samorazvitie', 'bmwm_insta', 'sonofthe90s', 'victorymoroz', 'andreeasasu90'],
    };

    const res = await sails.helpers.parsers.inst.rapidApiLogicbuilder.checkProfileSubscriptionJoi(params);

    expect(res).to.have.property('status', 'success');
    expect(res.payload).to.have.property('allSubscribed', false);
    expect(res.payload).to.have.property('notSubscribed');
    expect(res.payload).to.have.property('subscribed');
    expect(res.payload.subscribed).to.be.a('array');
    expect(res.payload.subscribed.length).to.be.eq(3);
    expect(res.payload.notSubscribed).to.be.a('array');
    expect(res.payload.notSubscribed.length).to.be.eq(2);

    // mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
  });

  it.skip('Check request result: getMediaIdJoi', async function () {

    this.timeout(300000);

    const params = {
      client,
      // shortCode: 'BpZS90LBOwq',
      shortCode: 'BpZS90LBOwq123',
    };

    const res = await sails.helpers.parsers.inst.inapi.getMediaIdJoi(params);
    mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
  });

  it.skip('Check request result: getLikesJoi (post exists & has likes)', async function () {

    this.timeout(300000);

    const params = {
      client,
      post: 'Bf3antMFqwr',
    };

    const res = await sails.helpers.parsers.inst.rapidApiLogicbuilder.getLikesJoi(params);

    expect(res).to.have.property('status', 'success');
    expect(res).to.have.property('subStatus', customConfig.HTTP_STATUS_FOUND.message);
    expect(res.payload).to.have.property('collector');
    expect(res.payload.collector).to.be.a('array');
    expect(res.payload.collector.length).to.be.eq(3);

    // mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
  });

  it.skip('Check request result: getLikesJoi (post exists & has no likes)', async function () {

    this.timeout(300000);

    const params = {
      client,
      post: 'CG79UYQBQvS',
    };

    const res = await sails.helpers.parsers.inst.rapidApiLogicbuilder.getLikesJoi(params);

    expect(res).to.have.property('status', 'success');
    expect(res).to.have.property('subStatus', customConfig.HTTP_STATUS_FOUND.message);
    expect(res.payload).to.have.property('collector');
    expect(res.payload.collector).to.be.a('array');
    expect(res.payload.collector.length).to.be.eq(0);

    // mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
  });

  it('Check request result: getLikesJoi (post does not exist)', async function () {

    this.timeout(300000);

    const params = {
      client,
      post: 'sdftSDFggsdgWETGGS',
    };

    const res = await sails.helpers.parsers.inst.rapidApiLogicbuilder.getLikesJoi(params);

    expect(res).to.have.property('status', 'success');
    expect(res).to.have.property('subStatus', customConfig.HTTP_STATUS_NOT_FOUND.message);

    // mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
  });

  it.skip('Check request result: checkLikesJoi', async function () {

    this.timeout(30000);

    // const params = {
    //   client,
    //   instProfile: 'some_profile_123',
    //   instPostCode: 'BpZS90LBOwq',
    // };

    const params = {
      client,
      instProfile: 'krasheniinniikova',
      instPostCode: 'BpZS90LBOwq',
    };

    const res = await sails.helpers.parsers.inst.inapi.checkLikesJoi(params);

    const likeDone = _.get(res, 'payload.likeMade', 'none');

    mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
  });

  it.skip('Check request result: getCommentsJoi', async function () {

    this.timeout(30000);

    const params = {
      client,
      mediaId: '1747317351232356320', // https://www.instagram.com/p/Bg_t9-OFL_g/
    };

    const res = await sails.helpers.parsers.inst.inapi.getCommentsJoi(params);
    mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
  });

  it.skip('Check request result: checkCommentsJoi', async function () {

    this.timeout(30000);

    // const params = {
    //   instProfile: 'some_profile_123',
    //   instPostCode: 'Bg_t9-OFL_g',
    // };

    // const params = {
    //   instProfile: 'mantis_ch',
    //   instPostCode: 'Bg_t9-OFL_g',
    // };

    // const params = {
    //   instProfile: 'ahshzgj',
    //   instPostCode: 'Bg_t9-OFL_g',
    // };

    // const params = {
    //   instProfile: '__yuliya_0927__',
    //   instPostCode: 'Bg_t9-OFL_g',
    // };

    const params = {
      client,
      instProfile: 'artemvast',
      instPostCode: 'BeQkuYDlTR8',
    };

    const res = await sails.helpers.parsers.inst.inapi.checkCommentsJoi(params);

    const commentDone = _.get(res, 'payload.commentMade', 'none');
    const commentText = _.get(res, 'payload.commentText', 'none');
    const numberOfWords = _.get(res, 'payload.numberOfWords', 0);

    mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
  });

});

describe.skip('Test DB', function () {

  let customConfig;
  let accounts = [];
  let clients = [];

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;

    this.timeout(700000);

    /**
     * Создаём 20 клиентов по 1 аккаунту у каждого
     */

    const numberOfSilverAccounts = 20;

    for (let i=0; i<numberOfSilverAccounts; i++) {

      const client = await clientSdk.createClientDB();

      const account = await accountSdk.createAccountDB({
        client: client.id,
      }, 'silver_personal');

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


    const numberOfGoldAccounts = 20;

    for (let i=0; i<numberOfGoldAccounts; i++) {

      const client = await clientSdk.createClientDB();

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

      clients.push(client);
      accounts.push(account);

    }

    const numberOfSilverAccounts02 = 20;

    for (let i=0; i<numberOfSilverAccounts02; i++) {

      const client = await clientSdk.createClientDB();

      const account = await accountSdk.createAccountDB({
        client: client.id,
      }, 'silver_personal');

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

    const numberOfPlatinumAccounts = 10;

    for (let i=0; i<numberOfPlatinumAccounts; i++) {

      const client = await clientSdk.createClientDB();

      const account = await accountSdk.createAccountDB({
        client: client.id,
      }, 'platinum_personal');

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

    const numberOfStarAccounts = 1;

    for (let i=0; i<numberOfStarAccounts; i++) {

      const client = await clientSdk.createClientDB();

      const account = await accountSdk.createAccountDB({
        client: client.id,
      }, 'star810');

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

  it.skip('Check GET_LOCK', async function () {

    const sqlGetLock01 = `
    SELECT GET_LOCK('lock01', 600) 
    `;

    const sqlGetLock02 = `
    SELECT GET_LOCK('lock02', 600) 
    `;

    const sqlReleaseLock = `
    SELECT RELEASE_LOCK('lock01') as release_lock
    `;

    const res01 = await sails.getDatastore('clientDb')
      .sendNativeQuery(sqlGetLock01);

    const res02 = await sails.getDatastore('clientDb')
      .sendNativeQuery(sqlGetLock02);

    mlog.success('res01: ', JSON.stringify(res01, null, 3));
    mlog.success('res02: ', JSON.stringify(res02, null, 3));

    // const res02 = await sails.getDatastore('clientDb')
    //   .sendNativeQuery(sqlGetLock);
    //
    // mlog.success('res02: ', JSON.stringify(res02, null, 3));
    //
    // const res03 = await sails.getDatastore('clientDb')
    //   .sendNativeQuery(sqlReleaseLock);
    //
    // mlog.success('res03: ', JSON.stringify(res03, null, 3));
    //
    // const res04 = await sails.getDatastore('clientDb')
    //   .sendNativeQuery(sqlGetLock);
    //
    // mlog.success('res04: ', JSON.stringify(res04, null, 3));



  });

  it.skip('Check concurrent GET_LOCKs', async function () {

    const sqlGetLock01 = `
    SELECT GET_LOCK('lock01', 60) 
    `;

    const sqlGetLock02 = `
    SELECT GET_LOCK('lock02', 60) 
    `;

    const sqlGetLock03 = `
    SELECT GET_LOCK('lock03', 60) 
    `;

    // const sqlSetTransactionSerializable = `
    // SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE
    // `;
    //
    // await sails.getDatastore('clientDb')
    //   .sendNativeQuery(sqlSetTransactionSerializable);


    const sql = [sqlGetLock01, sqlGetLock02, sqlGetLock03];

    // for (const elem in sql) {
    //
    //   const res = await sails.helpers.general.dbTest(sql[elem]);
    //
    //   mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
    //
    // }


    const promises = sql.map(async (elem) => {

      try {

        const res = await sails.helpers.general.dbTest(elem);

      } catch (ee) {
        mlog.error(`Error: ${JSON.stringify(ee, null, 3)}`);
      }

    });

    await Promise.all(promises);

    const ttt = 1000;

  });

  it.skip('Check concurrent GET_LOCKs advanced', async function () {

    this.timeout(700000);

    const sqlGetLock01 = `
    SELECT GET_LOCK('lock01', 20) 
    `;

    const sqlGetLock02 = `
    SELECT GET_LOCK('lock02', 20) 
    `;

    const sqlGetLock03 = `
    SELECT GET_LOCK('lock03', 20) 
    `;

    const sqlGetLock04 = `
    SELECT GET_LOCK('lock01', 60) 
    `;


    const sqlReleaseLock01 = `
    SELECT RELEASE_LOCK('lock01') 
    `;

    const sqlReleaseLock02 = `
    SELECT RELEASE_LOCK('lock02') 
    `;

    const sqlReleaseLock03 = `
    SELECT RELEASE_LOCK('lock03') 
    `;

    const sqlReleaseLock04 = `
    SELECT RELEASE_LOCK('lock01') 
    `;


    const sql = [
      {
        id: 1,
        getLock: sqlGetLock01,
        releaseLock: sqlReleaseLock01,
        delay: 30000,
      },
      {
        id: 2,
        getLock: sqlGetLock02,
        releaseLock: sqlReleaseLock02,
        delay: 30000,
      },
      {
        id: 3,
        getLock: sqlGetLock03,
        releaseLock: sqlReleaseLock03,
        delay: 30000,
      },
      {
        id: 4,
        getLock: sqlGetLock04,
        releaseLock: sqlReleaseLock04,
        delay: 10000,
      },
    ];

    // for (const elem in sql) {
    //
    //   const res = await sails.helpers.general.dbTest(sql[elem]);
    //
    //   mlog.success(`res: ${JSON.stringify(res, null, 3)}`);
    //
    // }


    const promises = sql.map(async (elem) => await sails.helpers.general.dbTestNew(elem));

    const res = await Promise.all(promises)
      .then(res => {
        return res;
      });

    const ttt = res;

  });

  it.skip('MAIN CASE: should allocate rooms for created accounts', async function () {

    this.timeout(700000);

    try {

      /**
       * Последовательное создание и запись в комнаты 20 аккаунтов
       */

      // for (const account in accounts) {
      //   const res = await sails.helpers.general.allocateRoomsJoi({
      //     accountGuid: accounts[account].guid,
      //   });
      // }



      // _.forEach(accounts, async (account) => {
      //   const res = await sails.helpers.general.allocateRoomsJoi({
      //     accountGuid: account.guid,
      //   });
      // });


      /**
       * Нагрузочный тест по одновременному созданию и записи в комнаты 20 аккаунтов
       */

      const promises = accounts.map(async (account) => {
        try {

          const res = await sails.helpers.general.allocateRoomsJoi({
            accountGuid: account.guid,
          });

            // await LogProcessor.error({
            //   message: 'allocateRoomsJoi result',
            //   // clientGuid,
            //   // accountGuid,
            //   // requestId: null,
            //   // childRequestId: null,
            //   errorName: sails.config.custom.GENERAL_ERROR.name,
            //   location: 'test',
            //   payload: {
            //     res,
            //     account,
            //   },
            // });

        } catch (ee) {
          const errorData = {
            message: message,
            errorName: 'DB Error',
            location: 'Test DB',
            payload: {
              name: ee.name || 'no error name',
              message: ee.message || 'no error message',
              code: ee.code || 'no error code',
            },
          };

          const throwError = true;
          if (throwError) {
            return await sails.helpers.general.catchErrorJoi({
              error: ee,
              location: moduleName,
              throwError: true,
              errorPayloadAdditional: {
                errorData,
              },
            });
          } else {
            await sails.helpers.general.catchErrorJoi({
              error: ee,
              location: moduleName,
              throwError: false,
              errorPayloadAdditional: {
                errorData,
              },
            });
            return exits.success({
              status: 'error',
              message: `${moduleName} performed`,
              payload: {},
            });
          }
        }

      });

      await Promise.all(promises);

    } catch (e) {
      mlog.error(`Error: ${JSON.stringify(e, null, 3)}`);

      const errorData = {
        message: message,
        errorName: 'DB Error',
        location: 'Test DB',
        payload: {
          name: e.name || 'no error name',
          message: e.message || 'no error message',
          code: e.code || 'no error code',
        },
      };

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
          errorPayloadAdditional: {
            errorData,
          },
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            errorData,
          },
        });
        return exits.success({
          status: 'error',
          message: `${moduleName} performed`,
          payload: {},
        });
      }

    }


  });

  it.skip('should get error on simultaneous connections', async function () {

    let res;
    let arr = [];

    try {

      mlog.log(`DB: ${process.env.MAIN_DATABASE_URL}`);

      for (let i = 100; i < 1000; i++) {
        arr.push(i);
      }

      mlog.log(`arr.lengh: ${arr.length}`);

      _.forEach(arr, async (elem) => {

        mlog.error(`elem: ${elem}`);

        await sails.helpers.storage.accountUpdateJoi({
          criteria: {guid: '328774b1-4417-4ae3-8dd9-2539ef473ad0'},
          data: {service: elem},
          createdBy: 'test',
        })


        // res = await Account.find({
        //   where: {
        //     guid: '28861a2b-47b0-4541-8827-23196993bc66',
        //   }
        // });
      });



    } catch (e) {

      const errorData = {
        message: message,
        errorName: 'DB Error',
        location: 'Test DB',
        payload: {
          name: e.name || 'no error name',
          message: e.message || 'no error message',
          code: e.code || 'no error code',
        },
      };

      mlog.error(JSON.stringify(errorData, null, 3));

      await LogProcessor.error(errorData);

    }

  });

});

describe.skip('Test post RegExp', function () {

  // RegExp (initial): POST_REGEXP=^(?:http|https)://www.instagram.com/p/(\S+)
  // RegExp (new): POST_REGEXP=^(?:http|https):\/\/www\.instagram\.com\/(?:p|tv)\/(\w+).*?

  describe('Test simple post', function () {

    const postCode = 'CFeg2X9Kcmr';

    it('Case 1', async function () {
      const postLink = `https://www.instagram.com/p/${postCode}/`;
      const instPostCode = await sails.helpers.general.getPostCodeJoi({postLink});
      expect(instPostCode).to.be.eq(postCode);
    });

    it('Case 2', async function () {
      const postLink = `https://www.instagram.com/p/${postCode}`;
      const instPostCode = await sails.helpers.general.getPostCodeJoi({postLink});
      expect(instPostCode).to.be.eq(postCode);
    });

    it('Case 3', async function () {
      const postLink = `https://www.instagram.com/p/${postCode}/?igshid=6at3cw3l4omd`;
      const instPostCode = await sails.helpers.general.getPostCodeJoi({postLink});
      expect(instPostCode).to.be.eq(postCode);
    });

  });

  describe('Test simple post with non-word character', function () {

    const postCode = 'CGb-oqBHyI3';

    it('Case 1', async function () {
      const postLink = `https://www.instagram.com/p/${postCode}/`;
      const instPostCode = await sails.helpers.general.getPostCodeJoi({postLink});
      expect(instPostCode).to.be.eq(postCode);
    });

    it('Case 2', async function () {
      const postLink = `https://www.instagram.com/p/${postCode}`;
      const instPostCode = await sails.helpers.general.getPostCodeJoi({postLink});
      expect(instPostCode).to.be.eq(postCode);
    });

    it('Case 3', async function () {
      const postLink = `https://www.instagram.com/p/${postCode}/?igshid=6at3cw3l4omd`;
      const instPostCode = await sails.helpers.general.getPostCodeJoi({postLink});
      expect(instPostCode).to.be.eq(postCode);
    });

  });

  describe('Test several videos post', function () {

    const postCode = 'CGfvyatJIa7';

    it('Case 1', async function () {
      const postLink = `https://www.instagram.com/p/${postCode}/`;
      const instPostCode = await sails.helpers.general.getPostCodeJoi({postLink});
      expect(instPostCode).to.be.eq(postCode);
    });

    it('Case 2', async function () {
      const postLink = `https://www.instagram.com/p/${postCode}`;
      const instPostCode = await sails.helpers.general.getPostCodeJoi({postLink});
      expect(instPostCode).to.be.eq(postCode);
    });

    it('Case 3', async function () {
      const postLink = `https://www.instagram.com/p/${postCode}/?igshid=sv4d37i6xsfo`;
      const instPostCode = await sails.helpers.general.getPostCodeJoi({postLink});
      expect(instPostCode).to.be.eq(postCode);
    });

  });

  describe('Test several photos post', function () {

    const postCode = 'CGfmRHoH0rc';

    it('Case 1', async function () {
      const postLink = `https://www.instagram.com/p/${postCode}/`;
      const instPostCode = await sails.helpers.general.getPostCodeJoi({postLink});
      expect(instPostCode).to.be.eq(postCode);
    });

    it('Case 2', async function () {
      const postLink = `https://www.instagram.com/p/${postCode}`;
      const instPostCode = await sails.helpers.general.getPostCodeJoi({postLink});
      expect(instPostCode).to.be.eq(postCode);
    });

    it('Case 3', async function () {
      const postLink = `https://www.instagram.com/p/${postCode}/?igshid=w170tfqh1nnk`;
      const instPostCode = await sails.helpers.general.getPostCodeJoi({postLink});
      expect(instPostCode).to.be.eq(postCode);
    });

  });

  describe('Test one video post', function () {

    const postCode = 'CGf3QFmJfyP';

    it('Case 1', async function () {
      const postLink = `https://www.instagram.com/p/${postCode}/`;
      const instPostCode = await sails.helpers.general.getPostCodeJoi({postLink});
      expect(instPostCode).to.be.eq(postCode);
    });

    it('Case 2', async function () {
      const postLink = `https://www.instagram.com/p/${postCode}`;
      const instPostCode = await sails.helpers.general.getPostCodeJoi({postLink});
      expect(instPostCode).to.be.eq(postCode);
    });

    it('Case 3', async function () {
      const postLink = `https://www.instagram.com/p/${postCode}/?igshid=1qo5v30xit1hb`;
      const instPostCode = await sails.helpers.general.getPostCodeJoi({postLink});
      expect(instPostCode).to.be.eq(postCode);
    });

  });

  describe('Test one IGTV post', function () {

    const postCode = 'CGdE7wMJ1T0';

    it('Case 1', async function () {
      const postLink = `https://www.instagram.com/tv/${postCode}/`;
      const instPostCode = await sails.helpers.general.getPostCodeJoi({postLink});
      expect(instPostCode).to.be.eq(postCode);
    });

    it('Case 2', async function () {
      const postLink = `https://www.instagram.com/tv/${postCode}`;
      const instPostCode = await sails.helpers.general.getPostCodeJoi({postLink});
      expect(instPostCode).to.be.eq(postCode);
    });

    it('Case 3', async function () {
      const postLink = `https://www.instagram.com/tv/${postCode}/?igshid=1cspxll7fu8gt`;
      const instPostCode = await sails.helpers.general.getPostCodeJoi({postLink});
      expect(instPostCode).to.be.eq(postCode);
    });

  });

});

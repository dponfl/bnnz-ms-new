"use strict";

const uuid = require('uuid-apikey');

const moduleName = 'test:general:allocateRooms';


module.exports = {


  friendlyName: 'test:general:allocateRooms',


  description: 'test:general:allocateRooms',


  inputs: {
  },


  exits: {

    success: {
      description: 'All done.',
    },

    err: {
      description: 'Error',
    }

  },


  fn: async function (inputs, exits) {

    try {

      /**
       * Create test client
       */

      const testClientUuidApiKey = uuid.create();

      let generateNewChatId = true;
      let chatId = null;
      let checkClientRec = null;

      while (generateNewChatId) {
        chatId = _.random(1, 5000000);
        checkClientRec = await Client.findOne({
          chat_id: chatId,
          messenger: 'telegram',
        });
        if (checkClientRec == null) {
          generateNewChatId = false;
        }
      }

      const testClient = await Client.create({
        guid: testClientUuidApiKey.uuid,
        first_name: 'Test-name-00',
        last_name: 'Test-surname-00',
        chat_id: chatId,
        messenger: 'telegram',
        deleted: false,
        banned: false,
      }).fetch();


      /**
       * Clear Room table and allocate rooms for 3 "bronze" accounts
       */

      if (false) {
        await Room.destroy({});

        const numAccounts = 3;

        const accounts = await accountsCreate(testClient, numAccounts);

        for (let i = 0; i < numAccounts; i++) {
          const res = await sails.helpers.general.allocateRooms.with({
            accountGuid: accounts[i].guid,
          });

          console.log('res: ', JSON.stringify(res, null, '   '));
        }
      }


      /**
       * Clear Room table and allocate rooms for 9 "bronze" accounts
       */

      if (false) {
        await Room.destroy({});

        const numAccounts = 9;

        const accounts = await accountsCreate(testClient, numAccounts);

        for (let i = 0; i < numAccounts; i++) {
          const res = await sails.helpers.general.allocateRooms.with({
            accountGuid: accounts[i].guid,
          });

          console.log('res: ', JSON.stringify(res, null, '   '));
        }
      }


      /**
       * Clear Room table and allocate rooms for 10 "bronze" accounts
       */

      // if (false) {
      //   await Room.destroy({});
      //
      //   const numAccounts = 10;
      //
      //   const accounts = await accountsCreate(testClient, numAccounts);
      //
      //   // sails.log('accounts: ', JSON.stringify(accounts, null, '   '));
      //
      //   for (let i = 0; i < numAccounts; i++) {
      //     const res = await sails.helpers.general.getRoom.with({
      //       roomsNum: 3,
      //       accountCategory: 'bronze',
      //     });
      //
      //     for (let j=0; j < res.payload.roomIDsRes.length; j++) {
      //       await Account.addToCollection(accounts[i].id, 'room', res.payload.roomIDsRes[j]);
      //     }
      //
      //     console.log('res: ', JSON.stringify(res, null, '   '));
      //   }
      // }



      return exits.success({
        status: 'ok',
        message: '**************',
        payload: {},
      })
    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
        }
      };
    }
  }
};

async function accountsCreate(clientRec, numAccounts) {

  const accountsArray = [];

  for (let i=0; i < numAccounts; i++) {

    const testAccountUuidApiKey = uuid.create();
    const account = await Account.create({
      guid: testAccountUuidApiKey.uuid,
      subscription_active: true,
      service_subscription_finalized: true,
      service: 10,
      ref_key: testAccountUuidApiKey.apiKey,
      deleted: false,
      banned: false,
      client: clientRec.id,
    }).fetch();
    accountsArray.push(account);

  }
  return accountsArray;
}

async function accountDelete(accounts) {
  for (const account of accounts) {
    await Account.destroy({id: account.id});
  }
  return true;
}

async function clientDelete(client) {
  await Client.destroy({id: client.id});
  return true;
}



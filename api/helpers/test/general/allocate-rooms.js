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

    const bronzeServiceId = 10;
    const goldServiceId = 30;
    const platinumServiceId = 40;

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

        const accounts = await accountsCreate(testClient, [
          {
            numAccounts: 3,
            service: bronzeServiceId,
          }
        ]);

        await allocateRoomsForAccounts(accounts);
      }


      /**
       * Clear Room table and allocate rooms for 9 "bronze" accounts
       */

      if (false) {
        await Room.destroy({});

        const accounts = await accountsCreate(testClient, [
          {
            numAccounts: 9,
            service: bronzeServiceId,
          }
        ]);

        await allocateRoomsForAccounts(accounts);
      }


      /**
       * Clear Room table and allocate rooms for 10 "bronze" accounts
       */

      if (true) {
        await Room.destroy({});

        const accounts = await accountsCreate(testClient, [
          {
            numAccounts: 10,
            service: bronzeServiceId,
          }
        ]);

        await allocateRoomsForAccounts(accounts);
      }


      /**
       * Clear Room table and allocate rooms for
       *    3 "bronze" accounts
       *    2 "gold" accounts
       *    1 "platinum" account
       */

      // if (false) {
      //   await Room.destroy({});
      //
      //   const accounts = await accountsCreate(testClient, [
      //     {
      //       numAccounts: 3,
      //       service: bronzeServiceId,
      //     }
      //   ]);
      //
      //   for (let i = 0; i < numAccounts; i++) {
      //     const res = await sails.helpers.general.allocateRooms.with({
      //       accountGuid: accounts[i].guid,
      //     });
      //
      //     sails.log.debug(`accountGuid: ${accounts[i].guid} accountId: ${accounts[i].id}\n
      //     rooms: ${JSON.stringify(res.payload.roomIDsRes, null, '')}\n\n`)
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

async function accountsCreate(clientRec, accounts) {

  const accountsArray = [];

  for (const account of accounts) {
    for (let i=0; i < account.numAccounts; i++) {
      const testAccountUuidApiKey = uuid.create();
      const newAccount = await Account.create({
        guid: testAccountUuidApiKey.uuid,
        subscription_active: true,
        service_subscription_finalized: true,
        service: account.service,
        ref_key: testAccountUuidApiKey.apiKey,
        deleted: false,
        banned: false,
        client: clientRec.id,
      }).fetch();
      accountsArray.push(newAccount);
    }
  }

  return accountsArray;
}

async function allocateRoomsForAccounts(accountsArray) {

  for (const account of accountsArray) {
    const res = await sails.helpers.general.allocateRooms.with({
      accountGuid: account.guid,
    });

    sails.log.debug(`accountGuid: ${account.guid} accountId: ${account.id}
rooms: ${JSON.stringify(res.payload.roomIDsRes, null, '   ')}\n`)
  }

  return true;

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



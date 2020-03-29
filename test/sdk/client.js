"use strict";

const casual = require('casual');
const mlog = require('mocha-logger');

module.exports = {

  deleteAllClientsDB: async () => {
    const funcName = 'test:sdk:client:deleteAllClientsDB';
    try {
      await Client.destroy({});
    } catch (e) {
      mlog.error(`${funcName} Error: code: ${e.code}, message: ${e.message}`);
    }
  },

  deleteClientByGuidDB: async (clientGuid) => {
    const funcName = 'test:sdk:client:deleteClientByGuidDB';
    try {
      await Client.destroy({guid: clientGuid});
    } catch (e) {
      mlog.error(`${funcName} Error: code: ${e.code}, message: ${e.message}`);
    }
  },

  createClientDB: async (client = null) => {
    const funcName = 'test:sdk:client:createClientDB';

    let clientRec;

    try {

      clientRec = await generateClient(client);
      clientRec = _.omit(clientRec, ['id', 'createdAt', 'updatedAt']);

      clientRec = await Client.create(clientRec).fetch();

      return clientRec;

    } catch (e) {
      mlog.error(`${funcName} Error: \ncode: ${e.code}\nmessage: ${e.message}\nclientRec: ${JSON.stringify(clientRec)}`);
    }

  },

  generateClient: async (client = null) => {
    const funcName = 'test:sdk:client:generateClient';

    let clientRec;

    try {

      clientRec = await generateClient(client);

      return clientRec;

    } catch (e) {
      mlog.error(`${funcName} Error: \ncode: ${e.code}\nmessage: ${e.message}\nclientRec: ${JSON.stringify(clientRec)}`);
    }

  },

};

async function generateClient(client = null) {
  const funcName = 'client:generateClient';

  let clientRec;

  try {

    clientRec = {
      id: casual.integer(1, 1000),
      guid: casual.uuid,
      first_name: casual.first_name,
      last_name: casual.last_name,
      chat_id: casual.integer(100, 1000000000),
      username: casual.username,
      tos_accepted: true,
      messenger: sails.config.custom.enums.messenger.TELEGRAM,
      deleted: false,
      banned: false,
      lang: 'ru',
      funnel_name: 'general',
      account_use: casual.uuid,
      createdAt: moment().format(),
      updatedAt: moment().add(1, 'minutes').format(),
    };

    if (client != null) {
      clientRec = _.assign(clientRec, client);
    }

    return clientRec;

  } catch (e) {
    mlog.error(`${funcName} Error: \ncode: ${e.code}\nmessage: ${e.message}\nclientRec: ${JSON.stringify(clientRec)}`);
  }
}
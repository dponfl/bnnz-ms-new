"use strict";

const casual = require('casual');
const mlog = require('mocha-logger');
const uuid = require('uuid-apikey');

module.exports = {

  deleteAllClients: async () => {
    const funcName = 'test:sdk:client:deleteAllClients';
    try {
      await Client.destroy({});
    } catch (e) {
      mlog.error(`${funcName} Error: code: ${e.code}, message: ${e.message}`);
    }
  },

  deleteClientByGuid: async (clientGuid) => {
    const funcName = 'test:sdk:client:deleteClientByGuid';
    try {
      await Client.destroy({guid: clientGuid});
    } catch (e) {
      mlog.error(`${funcName} Error: code: ${e.code}, message: ${e.message}`);
    }
  },

  createClient: async (client = null) => {
    const funcName = 'test:sdk:client:createClient';

    let clientRec;

    try {

      const uuidApiKey = uuid.create();

      clientRec = {
        guid: casual.uuid,
        first_name: casual.first_name,
        last_name: casual.last_name,
        chat_id: casual.integer(100, 1000000000),
        username: casual.username,
        ref_key: uuidApiKey.apiKey,
        tos_accepted: true,
        messenger: sails.config.custom.enums.messenger.TELEGRAM,
        deleted: false,
        banned: false,
        lang: 'ru',
        funnel_name: 'general',
        account_use: casual.uuid,
      };

      if (client != null) {
        clientRec = _.assign(clientRec, client);
      }

      await Client.create(clientRec);

      return clientRec;

    } catch (e) {
      mlog.error(`${funcName} Error: \ncode: ${e.code}\nmessage: ${e.message}\nclientRec: ${JSON.stringify(clientRec)}`);
    }

  }

};
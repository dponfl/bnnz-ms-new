"use strict";

const uuid = require('uuid-apikey');

module.exports = {


  friendlyName: 'Client create',


  description: 'Create new record for the client',


  inputs: {

    client: {
      friendlyName: 'client',
      description: 'Client record',
      type: 'ref',
      required: true,
    },

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

      const uuidApiKey = uuid.create();

      inputs.client = _.assignIn(inputs.client,
        {
          guid: uuidApiKey.uuid,
          key: uuidApiKey.apiKey
        });

      const service_id = _.get(inputs.client, 'service_id', null);

      let client = await Client.create(_.omit(inputs.client, ['accounts', 'service_id'])).fetch();

      // sails.log.warn('<<<<<<< !!!!!!!!!!!! >>>>>>> client response: ', client);

      const accountRaw = await sails.helpers.storage.accountCreate.with({
        account: {
          client: client.id,
          service: service_id,
          payment_plan_selected: (service_id != null),
        }
      });

      // sails.log.warn('<<<<<<< !!!!!!!!!!!! >>>>>>> accountCreate response: ', accountRaw);

      let acc = [];
      acc.push(accountRaw.payload);

      client = _.assignIn(client, {
        accounts: acc,
        account_use: accountRaw.payload.guid
      });

      // sails.log.warn('<<<<<<< !!!!!!!!!!!! >>>>>>> client data to update client record: ', client);

      client = await sails.helpers.storage.clientUpdate.with({
        criteria: {guid: client.guid},
        data: client,
      });

      // sails.log.warn('<<<<<<< !!!!!!!!!!!! >>>>>>> updated client data: ', client);

      return exits.success({
        status: 'ok',
        message: 'Client created',
        payload: client.payload.client,
      })

    } catch (e) {

      const errorLocation = 'api/helpers/storage/client-create';
      const errorMsg = sails.config.custom.CLIENTCREATE_ERROR;

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


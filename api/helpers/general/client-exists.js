const _ = require('lodash');

const moduleName = 'Helper general:client-exists';

module.exports = {


  friendlyName: 'Client exists',


  description: 'Check if the client exists in Client table and return client record',


  inputs: {
    client: {
      friendlyName: 'Client',
      description: 'Client object',
      type: 'ref',
      required: true,
    }
  },


  exits: {

    success: {
      description: 'All done.',
    },

    err: {
      description: 'Error exit',
    },

  },


  fn: async function (inputs, exits) {
    sails.log(moduleName + ', inputs: ', inputs);

    if (_.isNil(inputs.client.chatId)) {
      throw {err: {status: 'nok', message: 'No client.chatId', data: {}}};
    }

    let record = await Client.findOne({
      chat_id: inputs.client.chatId
    })
    // .populate('messages')
      .populate('rooms')
      .populate('service');

    if (!record) {

      /**
       * record for the specified criteria was not found
       */

      sails.log(moduleName + ', client was NOT FOUND');

      return exits.success({ status: 'not found', message: 'client not found', data: {} });

    } else {

      /**
       * found record for the specified criteria
       */

      sails.log(moduleName + ', client was FOUND');

      return exits.success({ status: 'found', message: 'client found', data: record });

    }

  }


};


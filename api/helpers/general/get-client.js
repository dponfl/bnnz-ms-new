const _ = require('lodash');

const moduleName = 'Helper general:get-client';

module.exports = {


  friendlyName: 'Get client',


  description: 'Returns the client record by messenger and chat_id',


  inputs: {
    messenger: {
      friendlyName: 'messenger',
      description: 'Messenger name',
      type: 'string',
      required: true,
    },
    chatId: {
      friendlyName: 'Client chatId',
      description: 'Client chatId in the messenger',
      type: 'string',
      required: true,
    },
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

    // if (_.isNil(inputs.client.chatId)) {
    //   throw {err: {status: 'nok', message: 'No client.chatId', data: {}}};
    // }

    let record = await Client.findOne({
      chat_id: inputs.chatId,
      messenger: inputs.messenger
    })
    // .populate('messages')
      .populate('rooms')
      .populate('service');

    if (!record) {

      /**
       * record for the specified criteria was not found
       */

      sails.log(moduleName + ', client was NOT FOUND');

      return exits.success({ status: 'not found', message: 'client not found',
        data: {messenger: inputs.messenger, chatId: inputs.chatId} });

    } else {

      /**
       * found record for the specified criteria
       */

      sails.log(moduleName + ', client was FOUND');

      return exits.success({ status: 'found', message: 'client found', data: record });

    }

  }


};


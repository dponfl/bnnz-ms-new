"use strict";

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
    msg: {
      friendlyName: 'Message',
      description: 'Message object',
      type: 'ref',
      required: true,
    }
  },


  exits: {

    success: {
      description: 'All done.',
    },

    noClientFound: {
      description: 'Client record was not found',
    },

    err: {
      description: 'Error',
    }

  },


  fn: async function (inputs, exits) {
    sails.log(moduleName + ', inputs: ', inputs);


    /**
     * Get chat_id depends on message type (text message or callback query
     */

    let chatId =  null;

    if (
      !_.isNil(inputs.msg.chat)
      && !_.isNil(inputs.msg.chat.id)
    ) {

      chatId = inputs.msg.chat.id;

    } else if (
      !_.isNil(inputs.msg.message)
      && !_.isNil(inputs.msg.message.chat)
      && !_.isNil(inputs.msg.message.chat.id)
    ) {

      chatId = inputs.msg.message.chat.id;

    }

    if (_.isNil(chatId)) {

      sails.log.error('getClient, no chat id in the message, input.msg: ', inputs.msg);

      return exits.err({
        message: 'getClient, ' + sails.config.custom.NO_CHAT_ID,
        payload: inputs.msg
      });

      // throw {err: {
      //     message: 'getClient, ' + sails.config.custom.NO_CHAT_ID,
      //     payload: inputs.msg
      //   }};

    }

    let record;

    try {

      record = await Client.findOne({
        chat_id: chatId,
        messenger: inputs.messenger
      })
      // .populate('messages')
        .populate('rooms')
        .populate('service');

      if (!record) {

        /**
         * Reply that the client was not found
         */

        sails.log(moduleName + ', client was NOT FOUND');

        // return exits.success({
        //   status: 'nok',
        //   message: sails.config.custom.CLIENT_NOT_FOUND,
        //   payload: null
        // });

        return exits.noClientFound({
          message: sails.config.custom.CLIENT_NOT_FOUND,
          payload: null
        })

      } else {

        /**
         * found record for the specified criteria
         */

        sails.log(moduleName + ', client was FOUND');

        return exits.success({
          status: 'ok',
          message: sails.config.custom.CLIENT_FOUND,
          payload: record
        });

      }

    } catch (e) {

      sails.log.error('getClient, Client.findOne error, input.msg: ', inputs.msg);

      // throw {err: {
      //     message: 'getClient, ' + sails.config.custom.CLIENT_GENERAL_ERROR,
      //     payload: inputs.msg
      //   }};

      return exits.err({
        message: 'getClient, ' + sails.config.custom.CLIENT_GENERAL_ERROR,
        payload: inputs.msg
      });

    }

  }


};



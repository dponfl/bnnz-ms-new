"use strict";

const _ = require('lodash');
const uuid = require('uuid-apikey');

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
    },
    createClient: {
      friendlyName: 'create a new client flag',
      description: 'shows if we need to create a new client if he does not exist',
      type: 'boolean',
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

    let createNewClientRecFlag = inputs.createClient || false;

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

      sails.log.error('getClient, no chat id in message, input.msg: ', inputs.msg);

      return exits.success({
        status: 'nok',
        message: 'getClient, no chat id in message',
        payload: inputs.msg
      });

    }

    let record = await Client.findOne({
      chat_id: chatId,
      messenger: inputs.messenger
    })
    // .populate('messages')
      .populate('rooms')
      .populate('service');

    if (!record && createNewClientRecFlag) {

      /**
       * record for the specified criteria was not found => create new client
       */

      let result = _.trim(inputs.msg.text).match(/\/start\s*ref(.+)/i);
      let params;

      let funnels = await Funnels.findOne({active: true});

      sails.log('funnels: ', funnels);

      if (result) {

        params = {
          messenger: 'telegram',
          guid: uuid.create().uuid,
          chat_id: chatId,
          first_name: inputs.msg.chat.first_name || '',
          last_name: inputs.msg.chat.last_name || '',
          username: inputs.msg.chat.username,
          date: inputs.msg.date,
          text: result[0],
          ref_key: result[1],
          is_ref: true,
          lang: getUserLang(inputs.msg),
          funnels: funnels.funnel_data || null,
        };

      } else {

        // w/o referral code

        params = {
          messenger: 'telegram',
          guid: uuid.create().uuid,
          chat_id: chatId,
          first_name: inputs.msg.chat.first_name || '',
          last_name: inputs.msg.chat.last_name || '',
          username: inputs.msg.chat.username,
          date: inputs.msg.date,
          text: '/start',
          ref_key: '',
          is_ref: false,
          lang: getUserLang(inputs.msg),
          funnels: funnels.funnel_data || null,
        };

      }

      try {

        let clientRaw = await sails.helpers.storage.clientCreate(params);

        return exits.success({
          status: 'ok',
          message: 'Client was created',
          payload: clientRaw.payload
        });

      } catch (e) {

        sails.log.error('Client create error: ', e);

      }



    } else {

      /**
       * found record for the specified criteria
       */

      sails.log(moduleName + ', client was FOUND');

      return exits.success({
        status: 'ok',
        message: 'client found',
        payload: record
      });

    }

  }


};

/**
 * Functions
 */

function getUserLang(data) {

  let useLang = 'en';

  if (!_.isNil(data.from.language_code)) {

    let res = data.from.language_code.match(/ru|en/i);

    if (res && res[0]) {
      useLang = res[0];
    }

    return useLang;

  }

} // getUserLang


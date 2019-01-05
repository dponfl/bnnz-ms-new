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

    // Load test client

    // let record = sails.config.custom.testClient;
    let record = false;

    // let record = await Client.findOne({
    //   chat_id: inputs.chatId,
    //   messenger: inputs.messenger
    // })
    // // .populate('messages')
    //   .populate('rooms')
    //   .populate('service');

    if (!record) {

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
          chat_id: inputs.msg.chat.id,
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
          chat_id: inputs.msg.chat.id,
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

        sails.log.error('Client create error');

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


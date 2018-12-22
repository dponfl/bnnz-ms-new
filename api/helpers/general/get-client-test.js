"use strict";

const _ = require('lodash');

const moduleName = 'Helper general:get-client-test';


module.exports = {


  friendlyName: 'Get client test',


  description: 'TEST - Returns the client record',


  inputs: {
    messenger: {
      friendlyName: 'messenger',
      description: 'Messenger name',
      type: 'string',
    },
    chatId: {
      friendlyName: 'Client chatId',
      description: 'Client chatId in the messenger',
      type: 'string',
    },
  },


  exits: {

    success: {
      outputFriendlyName: 'Client test',
    },

    err: {
      description: 'Error exit',
    },

  },


  fn: async function (inputs, exits) {

    sails.log.debug(moduleName + ', started...');

    let clientRec = {
      guid: '7e60e429-8f5f-4115-9bf5-bf45dd968063',
      first_name: 'Dmitry',
      last_name: 'Ponomarev',
      chat_id: '372204823',
      username: 'dmpon',
      messenger: 'telegram',
      lang: 'ru',
      funnel: {
        current: null,
        start: [
          {
            /**
             * First block
             */
            id: 'start_step_00',
            actionType: 'text',
            enabled: true,
            shown: false,
            done: false,
            previous: null,
            next: 'start_step_01',
            beforeHelper: null,
            forcedHelper: null,
            callbackHelper: null,
            message: {
              html: 'Сообщение 00',
            },
          },
          {
            /**
             * Second block
             */
            id: 'start_step_01',
            actionType: 'text',
            enabled: true,
            shown: false,
            done: false,
            previous: 'start_step_00',
            // next: 'start_step_01',
            next: null,
            beforeHelper: null,
            forcedHelper: null,
            callbackHelper: null,
            message: {
              html: 'Сообщение 01',
            },
          },
        ],
        help: [
          {

          }
        ],
        generic: [
          {

          }
        ],
      },
    };

    if (
      inputs.messenger == clientRec.messenger
      && inputs.chatId == clientRec.chat_id
    ) {

      return exits.success({
        status: 'ok',
        message: 'client found',
        payload: clientRec
      });

    } else {

      throw {
        err: {
          status: 'nok',
          message: 'client not found',
          payload: {
            messenger: inputs.messenger,
            chatId: inputs.chatId,
          }
        }
      };

    }


  } // fn


};


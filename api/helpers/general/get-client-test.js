"use strict";

const _ = require('lodash');

const moduleName = 'Helper general:get-client-test';


module.exports = {


  friendlyName: 'Get client test',


  description: 'TEST - Loads the text client record to the global custom.testClient',


  inputs: {
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

    const t = sails.helpers.general.translate;

    sails.config.custom.testClient = {
      guid: '7e60e429-8f5f-4115-9bf5-bf45dd968063',
      first_name: 'Dmitry',
      last_name: 'Ponomarev',
      chat_id: '372204823',
      username: 'dmpon',
      messenger: 'telegram',
      lang: 'ru',
      funnels: {
        current: null,
        start: [
          {
            /**
             * First block
             */
            id: 'start_step_01',
            actionType: 'text',
            enabled: true,
            shown: false,
            done: false,
            previousFunnel: null,
            previousId: null,
            nextFunnel: 'start',
            nextId: 'start_step_02',
            switchToFunnel: null,
            beforeHelper: null,
            afterHelperBlock: 'start',
            afterHelperName: 'ah',
            forcedHelper: null,
            callbackHelper: null,
            message: {
              // html: 'Сообщение 00',
              html: await t('ru', 'NEW_SUBS_WELCOME_01'),
            },
          },
          {
            /**
             * Second block
             */
            id: 'start_step_02',
            actionType: 'text',
            enabled: false,
            shown: false,
            done: false,
            previousFunnel: 'start',
            previousId: 'start_step_01',
            nextFunnel: 'start',
            nextId: 'start_step_03',
            switchToFunnel: null,
            beforeHelper: null,
            afterHelperBlock: null,
            afterHelperName: null,
            forcedHelper: null,
            callbackHelper: null,
            message: {
              // html: 'Сообщение 01',
              html: await t('ru', 'NEW_SUBS_WELCOME_02'),
            },
          },
          {
            /**
             * Block 03
             */
            id: 'start_step_03',
            actionType: 'text',
            enabled: false,
            shown: false,
            done: false,
            previousFunnel: 'start',
            previousId: 'start_step_02',
            nextFunnel: null,
            nextId: null,
            switchToFunnel: null,
            beforeHelper: null,
            afterHelperBlock: null,
            afterHelperName: null,
            forcedHelper: null,
            callbackHelper: null,
            message: {
              // html: 'Сообщение 01',
              html: await t('ru', 'NEW_SUBS_WELCOME_03'),
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

    exits.success();


  } // fn


};


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
        current: 'start',
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
            previous: null,
            next: 'start::start_step_02',
            switchToFunnel: null,
            beforeHelper: null,
            afterHelper: 'start::afterHelperTest',
            forcedHelper: null,
            inlineKeyboardHelper: null,
            message: {
              html: [
                {
                  text: 'NEW_SUBS_WELCOME_01',
                  style: 'b',
                  cr: 'DCR',
                },
                {
                  text: 'NEW_SUBS_WELCOME_01',
                  style: '',
                  cr: 'SCR',
                },
                {
                  text: 'NEW_SUBS_WELCOME_01',
                  style: 'i',
                  cr: '',
                },

              ],
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
            previous: 'start::start_step_01',
            next: 'start::start_step_03',
            switchToFunnel: null,
            beforeHelper: null,
            afterHelper: null,
            forcedHelper: null,
            inlineKeyboardHelper: null,
            message: {
              html: [
                {
                  text: 'NEW_SUBS_WELCOME_02',
                  style: 'b',
                  cr: '',
                },
              ],
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
            previous: 'start::start_step_02',
            next: 'start::start_step_04',
            switchToFunnel: null,
            beforeHelper: null,
            afterHelper: null,
            forcedHelper: null,
            inlineKeyboardHelper: null,
            message: {
              html: [
                {
                  text: 'NEW_SUBS_WELCOME_03',
                  style: 'i',
                  cr: '',
                },
              ],
            },
          },
          {
            /**
             * Block 04
             */
            id: 'start_step_04',
            actionType: 'forced',
            enabled: false,
            shown: false,
            done: false,
            previous: 'start::start_step_03',
            next: null,
            switchToFunnel: null,
            beforeHelper: null,
            afterHelper: 'start::step04',
            // afterHelper: null,
            forcedHelper: 'start::forcedStep04',
            inlineKeyboardHelper: null,
            message: {
              html: [
                {
                  text: 'NEW_SUBS_INST_01',
                  style: 'b',
                  cr: 'SCR',
                },
                {
                  text: 'NEW_SUBS_INST_01',
                  style: 'i',
                  cr: 'DCR',
                },
                {
                  text: 'NEW_SUBS_INST_01',
                  style: '',
                  cr: '',
                },
              ],
            },
          },
          {
            /**
             * Block 05_1
             */
            id: 'start_step_05_1',
            actionType: 'inline_keyboard',
            enabled: false,
            shown: false,
            done: false,
            previous: 'start::start_step_04',
            next: null,
            switchToFunnel: null,
            beforeHelper: null,
            afterHelper: null,
            forcedHelper: null,
            inlineKeyboardHelper: null,
            message: {
              html: [
                {
                  text: 'MSG_HELP',
                  style: '',
                  cr: '',
                },
              ],
              inline_keyboard: [
                [
                  {
                    text: ['ACT_NEW_POST'],
                    callback_data: 'upload_post'
                  },
                ],
                [
                  {
                    text: ['ACT_FAQ'],
                    url: 'www.google.com',
                  },
                  {
                    text: ['ACT_WEB'],
                    url: 'www.facebook.com',
                  },
                ],
              ],
            },
          },
          {
            /**
             * Block 05_2
             */
            id: 'start_step_05_2',
            actionType: 'inline_keyboard',
            enabled: false,
            shown: false,
            done: false,
            previous: 'start::start_step_04',
            next: null,
            switchToFunnel: null,
            beforeHelper: null,
            afterHelper: null,
            forcedHelper: null,
            inlineKeyboardHelper: null,
            message: {
              html: [
                {
                  text: 'NEW_SUBS_INST_05',
                  style: '',
                  cr: '',
                },
              ],
              inline_keyboard: [
                [
                  {
                    text: ['PLAN_PLATINUM'],
                    callback_data: 'instagram_plan_platinum'
                  },
                ],
                [
                  {
                    text: ['PLAN_GOLD'],
                    callback_data: 'instagram_plan_gold'
                  },
                ],
                [
                  {
                    text: ['PLAN_BRONZE'],
                    callback_data: 'instagram_plan_bronze'
                  },
                ],
              ],
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

    return exits.success();


  } // fn


};


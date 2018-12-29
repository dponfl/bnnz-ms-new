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
            previous: 'start::start_step_01',
            next: 'start::start_step_03',
            switchToFunnel: null,
            beforeHelper: null,
            afterHelper: null,
            forcedHelper: null,
            inlineKeyboardHelper: null,
            message: {
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
            previous: 'start::start_step_02',
            next: 'start::start_step_04',
            switchToFunnel: null,
            beforeHelper: null,
            afterHelper: null,
            forcedHelper: null,
            inlineKeyboardHelper: null,
            message: {
              html: await t('ru', 'NEW_SUBS_WELCOME_03'),
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
            forcedHelper: null,
            inlineKeyboardHelper: null,
            message: {
              html: await t('ru', 'NEW_SUBS_INST_01'),
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
              html: await t('ru', 'MSG_HELP'),
              inline_keyboard: [
                [
                  {
                    text: await t('ru', 'ACT_NEW_POST'),
                    callback_data: 'upload_post'
                  },
                ],
                [
                  {
                    text: await t('ru', 'ACT_FAQ'),
                    url: 'www.google.com',
                  },
                  {
                    text: await t('ru', 'ACT_WEB'),
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
              html: await t('ru', 'NEW_SUBS_INST_05'),
              inline_keyboard: [
                [
                  {
                    text: await t('ru', 'PLAN_PLATINUM'),
                    callback_data: 'instagram_plan_platinum'
                  },
                ],
                [
                  {
                    text: await t('ru', 'PLAN_GOLD'),
                    callback_data: 'instagram_plan_gold'
                  },
                ],
                [
                  {
                    text: await t('ru', 'PLAN_BRONZE'),
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


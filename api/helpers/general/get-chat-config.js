"use strict";

const _ = require('lodash');

const moduleName = 'general:getChatConfig';


module.exports = {


  friendlyName: 'Get chat config',

  description: 'Get chat config',

  inputs: {

  },

  exits: {

    success: {
      description: 'All done.',    },

  },


  fn: async function (inputs, exits) {

    sails.log.warn('******************** ' + moduleName + ' ********************');

    try {

      let confRec = await Config.findOne({
        active: true
      });

      sails.config.custom.chatConfig = confRec.config_data;

      // sails.log.warn('sails.config.custom.chatConfig: ', sails.config.custom.chatConfig);

      if (!sails.config.custom.chatConfig) {

        throw new Error('Critical error: No chat config');

      }

    } catch (e) {

      throw {err: {
          module: 'api/helpers/general/get-chat-config',
          message: 'api/helpers/general/get-chat-config: general error',
          payload: {
            error: {
              name: e.name || 'no error name',
              message: e.message || 'no error message',
              stack: e.stack || 'no error stack',
              code: e.code || 'no error code',
            }
          }
        }
      };

    }

    return exits.success({
      status: 'ok',
      message: 'Success',
      payload: {}
    });

  } // fn


};


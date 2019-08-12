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

    sails.log.info('******************** ' + moduleName + ' ********************');

    try {

      let confRec = await Config.findOne({
        active: true
      });

      sails.config.custom.config = confRec.config_data;

      // sails.log.warn('sails.config.custom.config: ', sails.config.custom.config);

      if (!sails.config.custom.config) {

        throw new Error('Critical error: No chat config');

      }

    } catch (e) {

      throw {err: {
          module: 'api/helpers/general/get-chat-config',
          message: 'api/helpers/general/get-chat-config: general error',
          payload: {
            error: {
              name: e.name || 'no error name',
              message: _.truncate(e.message, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error message',
              stack: _.truncate(e.stack, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error stack',
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


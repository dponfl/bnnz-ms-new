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

      if (sails.config.custom.config == null) {

        throw new Error('Critical error: Cannot get config');

      }

    } catch (e) {

      const errorLocation = 'api/helpers/general/get-chat-config';
      const errorMsg = 'api/helpers/general/get-chat-config: general error';

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
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


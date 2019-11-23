"use strict";

const moduleName = 'general:getConfig';


module.exports = {


  friendlyName: 'Get platform config',

  description: 'Get platform config',

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
      } else {

        await sails.helpers.analytics.buildEventsSchedule();

        sails.log.info('Platform configuration loaded successfully');
      }

    } catch (e) {

      const errorLocation = 'api/helpers/general/get-config';
      const errorMsg = 'api/helpers/general/get-config: general error';

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


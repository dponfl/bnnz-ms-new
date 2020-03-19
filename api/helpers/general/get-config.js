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

      /**
       * Load global config data
       */

      let confRec = await Config.findOne({
        active: true
      });

      sails.config.custom.config = confRec.config_data;

      /**
       * Load push messages data
       */

      const pushMessagesRaw = await sails.helpers.storage.pushMessagesGet();

      if (pushMessagesRaw.status === 'ok') {
        sails.config.custom.pushMessages = pushMessagesRaw.payload;
      } else {
        throw new Error('Critical error: Cannot get push messages data');
      }

      if (sails.config.custom.config == null) {
        throw new Error('Critical error: Cannot get config');
      } else {

        await sails.helpers.analytics.buildAnalyticsEventsSchedule();

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
          payload: {
            error: e,
          },
        }
      };

    }

    return exits.success({
      status: 'ok',
      message: 'Success',
      payload: sails.config.custom,
    });

  } // fn


};


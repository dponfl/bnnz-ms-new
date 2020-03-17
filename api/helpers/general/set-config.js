"use strict";

const moduleName = 'general:setConfig';


module.exports = {


  friendlyName: 'Set platform config',

  description: 'Set platform config',

  inputs: {
    data: {
      friendlyName: 'input data',
      description: 'input data',
      type: 'ref',
    },
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

      if (inputs.data != null) {
        sails.config.custom = _.assign(sails.config.custom, inputs.data);
      }

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

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


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
      })
        .tolerate(async (err) => {

          err.details = {
            criteria: {
              active: true,
            },
          };

          await LogProcessor.dbError({
            error: err,
            message: 'Config.findOne() error',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              criteria: {
                active: true,
              },
            },
          });

          return null;
        });

      if (confRec == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
          location: moduleName,
          message: 'Config.findOne() error',
          // clientGuid,
          // accountGuid,
          errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
          payload: {
            criteria: {
              active: true,
            },
          },
        });
      }

      sails.config.custom.config = confRec.config_data;

      /**
       * Load push messages data
       */

      // const pushMessagesRaw = await sails.helpers.storage.pushMessagesGet();
      //
      // if (pushMessagesRaw.status === 'ok') {
      //   sails.config.custom.pushMessages = pushMessagesRaw.payload;
      // } else {
      //   // throw new Error('Critical error: Cannot get push messages data');
      //
      //   await sails.helpers.general.throwErrorJoi({
      //     errorType: sails.config.custom.enums.errorType.CRITICAL,
      //     emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
      //     location: moduleName,
      //     message: 'Cannot get push messages data',
      //     errorName: sails.config.custom.GENERAL_ERROR.name,
      //     payload: {
      //       pushMessagesRaw,
      //     },
      //   });
      //
      // }

      if (sails.config.custom.config == null) {
        // throw new Error('Critical error: Cannot get config');

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
          location: moduleName,
          message: 'Cannot get config',
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {},
        });

      } else {

        await sails.helpers.analytics.buildAnalyticsEventsSchedule();

        sails.log.info('Platform configuration loaded successfully');

        await LogProcessor.info({
          message: 'Platform configuration loaded successfully',
          // clientGuid,
          // accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: 'Info',
          location: moduleName,
          payload: {},
        });

      }

    } catch (e) {

      // const errorLocation = 'api/helpers/general/get-config';
      // const errorMsg = 'api/helpers/general/get-config: general error';
      //
      // sails.log.error(errorLocation + ', error: ' + errorMsg);
      // sails.log.error(errorLocation + ', error details: ', e);
      //
      // throw {err: {
      //     module: errorLocation,
      //     message: errorMsg,
      //     payload: {
      //       error: e,
      //     },
      //   }
      // };

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
        });
        return exits.success({
          status: 'ok',
          message: `${moduleName} performed`,
          payload: {},
        });
      }

    }

    return exits.success({
      status: 'ok',
      message: 'Success',
      payload: sails.config.custom,
    });

  } // fn


};


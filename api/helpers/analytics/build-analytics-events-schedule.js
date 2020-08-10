"use strict";

const moduleName = 'analytics:buildAnalyticsEventsSchedule';


module.exports = {


  friendlyName: 'Build analytics events schedule',

  description: 'Build analytics events schedule',

  inputs: {

  },

  exits: {

    success: {
      description: 'All done.',    },

  },


  fn: async function (inputs, exits) {

    sails.log.info('******************** ' + moduleName + ' ********************');

    let hourlyEvents = [];
    let dailyEvents = [];
    let weeklyEvents = [];
    let monthlyEvents = [];

    try {

      if (sails.config.custom.config.analytics.events_schedule == null) {
        // throw new Error('Critical error: Cannot get analytics events schedule config');

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
          location: moduleName,
          message: 'Critical error: Cannot get analytics events schedule config',
          errorName: sails.config.custom.ANALITICS_ERROR.name,
          payload: {
            location: 'sails.config.custom.config.analytics',
            key: 'events_schedule',
            value: sails.config.custom.config.analytics.events_schedule,
          },
        });

      } else {
        sails.log.info('Analytics events schedule configuration loaded successfully');
      }

      _.forEach(sails.config.custom.config.analytics.events_schedule, (val) => {

        if (val.schedule.hourly) {
          hourlyEvents.push(val.event);
        }

        if (val.schedule.daily) {
          dailyEvents.push(val.event);
        }

        if (val.schedule.weekly) {
          weeklyEvents.push(val.event);
        }

        if (val.schedule.monthly) {
          monthlyEvents.push(val.event);
        }

      });

      sails.config.custom.config.analyticSchedule = {
        hourly: hourlyEvents,
        daily: dailyEvents,
        weekly: weeklyEvents,
        monthly: monthlyEvents,
      };

      sails.log.info('Analytics events schedule: \n', sails.config.custom.config.analyticSchedule);

    } catch (e) {

      // const errorLocation = 'api/helpers/analytics/build-events-schedule';
      // const errorMsg = 'api/helpers/analytics/build-events-schedule: General error';
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
      payload: {}
    });

  } // fn


};


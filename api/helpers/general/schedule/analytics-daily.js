"use strict";

const _ = require('lodash');
const moment = require('moment');
const uuid = require('uuid-apikey');

const moduleName = 'general::schedule::analytics-daily';


module.exports = {


  friendlyName: 'Scheduler for calculation and saving daily analytics data',

  description: 'Scheduler for calculation and saving daily analytics data',

  inputs: {

  },

  exits: {

    success: {
      description: 'All done.',    },

  },


  fn: async function (inputs, exits) {

    let events = null;

    try {

      sails.log.warn(`********** ${moduleName} is running: ` + moment().format() + ' **********');

      /**
       * Формируем временные границы, частоту события, период рассчёта
       */

      const eventsStart = moment().subtract(1, 'days').startOf('day').format();
      const eventsEnd = moment().startOf('day').subtract(1, 'seconds').format();
      const eventFrequency = sails.config.custom.enums.analytics.frequency.DAILY;
      const eventPeriod = moment().subtract(1, 'days').startOf('hour').format('YYYY-MM-DD');

      sails.log.info(`eventStart: ${eventsStart} eventEnd: ${eventsEnd}`);

      /**
       * Выполняем список событий
       */

      _.forEach(sails.config.custom.config.analyticSchedule.daily, async (event) => {

        const eventHelperName = _.camelCase(event);

        const eventRawResult = await sails.helpers.analytics[eventHelperName].with({
          start: eventsStart,
          end: eventsEnd,
        });

        sails.log.info(`event: ${moduleName}::${eventHelperName}, eventRawResult: \n`, eventRawResult);

        /**
         * Сохраняем подсчитанное значение в таблице "analytics"
         */

        const analyticsRec = {
          guid: uuid.create().uuid,
          frequency: eventFrequency,
          event: event,
          value: eventRawResult.payload.value || 0,
          currency: eventRawResult.payload.currency || null,
          period: eventPeriod,
          elapsed_time: eventRawResult.payload.elapsedTime || 0,
        };

        await Analytics.create(analyticsRec);

      });

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

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


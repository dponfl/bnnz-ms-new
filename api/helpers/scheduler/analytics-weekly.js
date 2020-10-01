"use strict";

const _ = require('lodash');
const moment = require('moment');
const uuid = require('uuid-apikey');

const moduleName = 'general::schedule::analytics-weekly';


module.exports = {


  friendlyName: 'Scheduler for calculation and saving weekly analytics data',

  description: 'Scheduler for calculation and saving weekly analytics data',

  inputs: {

  },

  exits: {

    success: {
      description: 'All done.',    },

  },


  fn: async function (inputs, exits) {

    try {

      sails.log.warn(`********** ${moduleName} is running: ` + moment().format() + ' **********');

      moment.updateLocale("en", {
        week: {
          dow: 1, // First day of week is Monday
          doy: 7  // First week of year must contain 1 January (7 + 1 - 1)
        }});

      /**
       * Формируем временные границы, частоту события, период рассчёта
       */

      const eventsStart = moment().subtract(1, 'weeks').startOf('week').format();
      const eventsEnd = moment().startOf('week').subtract(1, 'seconds').format();
      const eventFrequency = sails.config.custom.enums.analytics.frequency.WEEKLY;
      const eventPeriod = moment().subtract(1, 'weeks').startOf('week').format('YYYY-MM-DD');

      sails.log.info(`eventStart: ${eventsStart} eventEnd: ${eventsEnd}`);

      /**
       * Выполняем список событий
       */

      for (const event of sails.config.custom.config.analyticSchedule.weekly) {

        /**
         * Нужно проверить, что записи для рассчитанного eventPeriod и события event
         * ещё нет в базе данных
         */

        const getRecCond = {
          frequency: eventFrequency,
          event: event,
          period: eventPeriod,
        };

        const getRec = await Analytics.findOne(getRecCond)
          .tolerate(async (err) => {

            err.details = {
              getRecCond,
            };

            await LogProcessor.dbError({
              error: err,
              message: 'Analytics.findOne() error',
              // clientGuid,
              // accountGuid,
              // requestId: null,
              // childRequestId: null,
              location: moduleName,
              payload: {
                getRecCond,
              },
            });

            return null;
          });

        if (getRec == null) {

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

          await Analytics.create(analyticsRec)
            .tolerate(async (err) => {

              err.details = {
                analyticsRec,
              };

              await LogProcessor.dbError({
                error: err,
                message: 'Analytics.create() error',
                // clientGuid,
                // accountGuid,
                // requestId: null,
                // childRequestId: null,
                location: moduleName,
                payload: {
                  analyticsRec,
                },
              });

              return true;
            });

        } else {

          sails.log.warn('Record for the following conditions already exists: \n', getRecCond);

        }

      }

    } catch (e) {

      // const errorLocation = moduleName;
      // const errorMsg = `${moduleName}: General error`;
      //
      // sails.log.error(errorLocation + ', error: ' + errorMsg);
      // sails.log.error(errorLocation + ', error details: ', e);
      //
      // throw {err: {
      //     module: errorLocation,
      //     message: errorMsg,
      //     payload: {},
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


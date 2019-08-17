"use strict";

const _ = require('lodash');
const schedule = require('node-schedule');

const moduleName = 'general:activateSchedule';


module.exports = {


  friendlyName: 'Run scheduler',

  description: 'Run scheduler',

  inputs: {

  },

  exits: {

    success: {
      description: 'All done.',    },

  },


  fn: async function (inputs, exits) {

    sails.log.warn('******************** ' + moduleName + ' ********************');

/*

  *    *    *    *    *    *
  ┬    ┬    ┬    ┬    ┬    ┬
  │    │    │    │    │    │
  │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
  │    │    │    │    └───── month (1 - 12)
  │    │    │    └────────── day of month (1 - 31)
  │    │    └─────────────── hour (0 - 23)
  │    └──────────────────── minute (0 - 59)
  └───────────────────────── second (0 - 59, OPTIONAL)



*/

    // const scheduleRules = '*/1 */1 * * * *'; // every one second
    // const scheduleRules = '*/5 */1 * * * *'; // every 5 seconds
    // const scheduleRules = '42 * * * *'; // Execute a cron job when the minute is 42 (e.g. 19:42, 20:42, etc.)

    const schedules = [];


    try {

      if (_.has(sails.config.custom.config, 'schedule')) {

        let scheduleConfig = sails.config.custom.config.schedule;

        for (let i=0; i < scheduleConfig.length; i++) {

          if (!(_.has(scheduleConfig[i], 'rule') && _.has(scheduleConfig[i], 'action'))) {

            sails.log.error('ERROR: Wrong schedule config format: ', scheduleConfig[i]);

          } else {

            schedules[i] = schedule.scheduleJob(scheduleConfig[i].rule, async function () {
              await sails.helpers.general.schedule[scheduleConfig[i].action]();
            });

          }

        }

      }

    } catch (e) {

      sails.log.error('api/helpers/general/activate-schedule, error: ', e);

      throw {err: {
          module: 'api/helpers/general/activate-schedule',
          message: 'api/helpers/general/activate-schedule: general error',
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


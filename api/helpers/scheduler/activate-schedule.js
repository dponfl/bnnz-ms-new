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

    sails.log.info('******************** ' + moduleName + ' ********************');

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

      if (_.has(sails.config.custom.config, 'schedule.rules')) {

        let scheduleConfigRules = sails.config.custom.config.schedule.rules;

        for (let i=0; i < scheduleConfigRules.length; i++) {

          if (!(_.has(scheduleConfigRules[i], 'rule')
            && _.has(scheduleConfigRules[i], 'action')
            && _.has(scheduleConfigRules[i], 'location')
          )) {

            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
              location: moduleName,
              message: 'Wrong schedule config format',
              errorName: sails.config.custom.SCHEDULER_ERROR.name,
              payload: {
                scheduleConfigRules: scheduleConfigRules[i],
              },
            });


          } else {

            schedules[i] = schedule.scheduleJob(scheduleConfigRules[i].rule, async function () {
              await sails.helpers.scheduler[scheduleConfigRules[i].location][scheduleConfigRules[i].action]();
            });

          }

        }

      } else {

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
          location: moduleName,
          message: 'Wrong schedule config format: no "schedule.rules"',
          errorName: sails.config.custom.SCHEDULER_ERROR.name,
          payload: {
            scheduleConfig: sails.config.custom.config.schedule,
          },
        });

      }

    } catch (e) {

      const throwError = false;
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


/**
 * Test config data
 */

// "schedule": [
//   {
//     "rule": "*/1 */1 * * * *",
//     "location": "test",
//     "action": "helperOne"
//   },
//   {
//     "rule": "*/3 */1 * * * *",
//     "location": "test",
//     "action": "helperThree"
//   },
//   {
//     "rule": "*/5 */1 * * * *",
//     "location": "test",
//     "action": "helperFive"
//   }
// ],


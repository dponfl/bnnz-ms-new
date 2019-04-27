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


    // const scheduleRules = '*/1 */1 * * * *'; // every one second
    // const scheduleRules = '*/5 */1 * * * *'; // every 5 seconds

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

      throw {err: {
          module: 'api/helpers/general/activate-schedule',
          message: 'api/helpers/general/activate-schedule: general error',
          payload: {
            error: {
              name: e.name || 'no error name',
              message: _.truncate(e.message, {length: 320}) || 'no error message',
              stack: _.truncate(e.stack, {length: 320}) || 'no error stack',
              code: e.code || 'no error code',
            }
          }
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


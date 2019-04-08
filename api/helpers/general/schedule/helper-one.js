"use strict";

const _ = require('lodash');
const moment = require('moment');


const moduleName = 'general:helperOne';


module.exports = {


  friendlyName: 'Scheduler helper one',

  description: 'Scheduler helper one',

  inputs: {

  },

  exits: {

    success: {
      description: 'All done.',    },

  },


  fn: async function (inputs, exits) {

    try {

      sails.log.warn(`********** ${moduleName} is running: ` + moment().format() + ' **********');

    } catch (e) {

      throw {err: {
          module: 'api/helpers/general/schedule/helper-one',
          message: 'api/helpers/general/schedule/helper-one: general error',
          payload: {
            error: {
              name: e.name || 'no error name',
              message: e.message || 'no error message',
              stack: e.stack || 'no error stack',
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


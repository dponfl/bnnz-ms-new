"use strict";

const _ = require('lodash');
const moment = require('moment');


const moduleName = 'general:helperFive';


module.exports = {


  friendlyName: 'Scheduler helper five',

  description: 'Scheduler helper five',

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
          module: 'api/helpers/general/schedule/helper-five',
          message: 'api/helpers/general/schedule/helper-five: general error',
          payload: {
            error: {
              name: e.name || 'no error name',
              message: _.truncate(e.message, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error message',
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


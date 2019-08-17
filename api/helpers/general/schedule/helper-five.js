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

      const errorLocation = 'api/helpers/general/schedule/helper-five';
      const errorMsg = 'Error';

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


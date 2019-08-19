"use strict";

const _ = require('lodash');
const moment = require('moment');


const moduleName = 'general:helperThree';


module.exports = {


  friendlyName: 'Scheduler helper three',

  description: 'Scheduler helper three',

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

      const errorLocation = 'api/helpers/general/schedule/helper-three';
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


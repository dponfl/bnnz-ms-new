"use strict";

const moment = require('moment');

const moduleName = 'analytics:clientsBanned';


module.exports = {


  friendlyName: 'analytics:clientsBanned',

  description: 'Calculate data for clients_banned event',

  inputs: {
    start: {
      friendlyName: 'start',
      description: 'calculation interval start date & time',
      type: 'string',
      required: true,
    },
    end: {
      friendlyName: 'end',
      description: 'calculation interval end date & time',
      type: 'string',
      required: true,
    },
  },

  exits: {

    success: {
      description: 'All done.',    },

  },


  fn: async function (inputs, exits) {

    sails.log.info(`******************** ${moduleName} at ${moment().format()} ********************`);

    let elapsedTimeStart;
    let elapsedTimeEnd;
    let elapsedTime;
    let numClients;

    try {

      elapsedTimeStart = moment();

      numClients = await Client.count({
        where: {
          banned: true,
        },
      });

      elapsedTimeEnd = moment();

      elapsedTime = moment.duration(elapsedTimeEnd.diff(elapsedTimeStart)).asSeconds();

      // sails.log.info(`Start: ${moment(inputs.start).format()}`);
      // sails.log.info(`End: ${moment(inputs.end).format()}`);
      // sails.log.info(`numClients: ${numClients}`);
      // sails.log.info(`elapsedTime: ${elapsedTime}`);

      return exits.success({
        status: 'ok',
        message: 'Success',
        payload: {
          value: numClients,
          elapsedTime: elapsedTime,
        }
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

  } // fn


};


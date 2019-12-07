"use strict";

const moment = require('moment');

const moduleName = 'analytics:numPosts';


module.exports = {


  friendlyName: 'analytics:numPosts',

  description: 'Calculate data for num_posts event',

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
    let numPosts;

    try {

      elapsedTimeStart = moment();

      numPosts = await Posts.count({
        where: {
          createdAt: {
            '>=': moment(inputs.start).format(),
            '<=': moment(inputs.end).format()
          }
        },
      });

      elapsedTimeEnd = moment();

      elapsedTime = moment.duration(elapsedTimeEnd.diff(elapsedTimeStart)).asSeconds();

      // sails.log.info(`Start: ${moment(inputs.start).format()}`);
      // sails.log.info(`End: ${moment(inputs.end).format()}`);
      // sails.log.info(`numPosts: ${numPosts}`);
      // sails.log.info(`elapsedTime: ${elapsedTime}`);

      return exits.success({
        status: 'ok',
        message: 'Success',
        payload: {
          value: numPosts,
          elapsedTime: elapsedTime,
        }
      });

    } catch (e) {

      const errorLocation = 'api/helpers/analytics/num-posts';
      const errorMsg = 'api/helpers/analytics/num-posts: General error';

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


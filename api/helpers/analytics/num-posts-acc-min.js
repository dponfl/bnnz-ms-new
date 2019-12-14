"use strict";

const moment = require('moment');

const moduleName = 'analytics:numPostsAccMin';


module.exports = {


  friendlyName: 'analytics:numPostsAccMin',

  description: 'Calculate data for num_posts_acc_min event',

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
    let numPostsMinRec;
    let numPostsMin = 0;

    try {

      elapsedTimeStart = moment();

      const sql = `
SELECT p.account_guid AS accountGuid, COUNT(*) AS numRecords
FROM  posts p
WHERE p.createdAt >= "${moment(inputs.start).format()}"
AND p.createdAt <= "${moment(inputs.end).format()}"
GROUP BY p.account_guid      
`;

      const rawResult = await sails.sendNativeQuery(sql);

      if (rawResult.rows == null) {

        throw new Error('Critical error: sendNativeQuery was not performed correctly');

      }

      // sails.log.info('SQL result rows: ', rawResult.rows);

      if (rawResult.rows.length > 0) {

        numPostsMinRec = _.minBy(rawResult.rows, 'numRecords');
        numPostsMin = numPostsMinRec.numRecords;

      }

      // sails.log.info('Min value: ', numPostsMin);

      elapsedTimeEnd = moment();

      elapsedTime = moment.duration(elapsedTimeEnd.diff(elapsedTimeStart)).asSeconds();

      return exits.success({
        status: 'ok',
        message: 'Success',
        payload: {
          value: numPostsMin,
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


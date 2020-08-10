"use strict";

const moment = require('moment');

const moduleName = 'analytics:numPostsAccAv';


module.exports = {


  friendlyName: 'analytics:numPostsAccAv',

  description: 'Calculate data for num_posts_acc_av event',

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
    let numPostsAv = 0;

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

        // throw new Error('Critical error: sendNativeQuery was not performed correctly');

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'Critical error: sendNativeQuery was not performed correctly',
          errorName: sails.config.custom.ANALITICS_ERROR.name,
          payload: rawResult,
        });

      }

      // sails.log.info('SQL result rows: ', rawResult.rows);

      if (rawResult.rows.length > 0) {

        numPostsAv = _.meanBy(rawResult.rows, 'numRecords');

      }

      // sails.log.info('Average value: ', numPostsAv);

      elapsedTimeEnd = moment();

      elapsedTime = moment.duration(elapsedTimeEnd.diff(elapsedTimeStart)).asSeconds();

      return exits.success({
        status: 'ok',
        message: 'Success',
        payload: {
          value: numPostsAv,
          elapsedTime: elapsedTime,
        }
      });

    } catch (e) {

      // const errorLocation = moduleName;
      // const errorMsg = `${moduleName}: General error`;
      //
      // sails.log.error(errorLocation + ', error: ' + errorMsg);
      // sails.log.error(errorLocation + ', error details: ', e);
      //
      // throw {err: {
      //     module: errorLocation,
      //     message: errorMsg,
      //     payload: {},
      //   }
      // };

      const throwError = true;
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

  } // fn


};


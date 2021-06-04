"use strict";

const moment = require('moment');

const moduleName = 'analytics:newAccountsActiveAll';


module.exports = {


  friendlyName: 'analytics:newAccountsActiveAll',

  description: 'Calculate data for new_accounts_active_all event',

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

    sails.log.info(`******************** ${moduleName} at ${moment().utc().format()} ********************`);

    let elapsedTimeStart;
    let elapsedTimeEnd;
    let elapsedTime;
    let numAccounts;

    try {

      elapsedTimeStart = moment();

      numAccounts = await Account.count({
        where: {
          createdAt: {
            '>=': moment(inputs.start).utc().format(),
            '<=': moment(inputs.end).utc().format()
          },
          deleted: false,
          banned: false,
          subscription_active: true,
        },
      })
        .tolerate(async (err) => {

          err.details = {
            where: {
              createdAt: {
                '>=': moment(inputs.start).utc().format(),
                '<=': moment(inputs.end).utc().format()
              },
              deleted: false,
              banned: false,
              subscription_active: true,
            },
          };

          await LogProcessor.dbError({
            error: err,
            message: 'Account.count() error',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              where: {
                createdAt: {
                  '>=': moment(inputs.start).utc().format(),
                  '<=': moment(inputs.end).utc().format()
                },
                deleted: false,
                banned: false,
                subscription_active: true,
              },
            },
          });

          return 0;
        });

      elapsedTimeEnd = moment();

      elapsedTime = moment.duration(elapsedTimeEnd.diff(elapsedTimeStart)).asSeconds();

      // sails.log.info(`Start: ${moment(inputs.start).utc().format()}`);
      // sails.log.info(`End: ${moment(inputs.end).utc().format()}`);
      // sails.log.info(`numAccounts: ${numAccounts}`);
      // sails.log.info(`elapsedTime: ${elapsedTime}`);

      return exits.success({
        status: 'ok',
        message: 'Success',
        payload: {
          value: numAccounts,
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


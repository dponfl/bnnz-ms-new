"use strict";

const moment = require('moment');

const moduleName = 'analytics:newAccountsNotActiveAll';


module.exports = {


  friendlyName: 'analytics:newAccountsNotActiveAll',

  description: 'Calculate data for new_accounts_not_active_all event',

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
    let numAccounts;

    try {

      elapsedTimeStart = moment();

      numAccounts = await Account.count({
        where: {
          createdAt: {
            '>=': moment(inputs.start).format(),
            '<=': moment(inputs.end).format()
          },
          deleted: false,
          banned: false,
          subscription_active: false,
        },
      })
        .tolerate(async (err) => {

          err.details = {
            where: {
              createdAt: {
                '>=': moment(inputs.start).format(),
                '<=': moment(inputs.end).format()
              },
              deleted: false,
              banned: false,
              subscription_active: false,
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
                  '>=': moment(inputs.start).format(),
                  '<=': moment(inputs.end).format()
                },
                deleted: false,
                banned: false,
                subscription_active: false,
              },
            },
          });

          return 0;
        });

      elapsedTimeEnd = moment();

      elapsedTime = moment.duration(elapsedTimeEnd.diff(elapsedTimeStart)).asSeconds();

      // sails.log.info(`Start: ${moment(inputs.start).format()}`);
      // sails.log.info(`End: ${moment(inputs.end).format()}`);
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


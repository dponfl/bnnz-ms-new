"use strict";

const moment = require('moment');

const moduleName = 'analytics:numClients';


module.exports = {


  friendlyName: 'analytics:numClients',

  description: 'Calculate data for new_clients event',

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
    let numClients;

    try {

      elapsedTimeStart = moment();

      numClients = await Client.count({
        where: {
          createdAt: {
            '>=': moment(inputs.start).format(),
            '<=': moment(inputs.end).format()
          }
        },
      })
        .tolerate(async (err) => {

          err.details = {
            where: {
              createdAt: {
                '>=': moment(inputs.start).format(),
                '<=': moment(inputs.end).format()
              }
            },
          };

          await LogProcessor.dbError({
            error: err,
            message: 'Client.count() error',
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
                }
              },
            },
          });

          return 0;
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


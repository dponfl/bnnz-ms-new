"use strict";

const moment = require('moment');

const moduleName = 'analytics:accountsNotActiveGoldCommercialTotal';


module.exports = {


  friendlyName: 'analytics:accountsNotActiveGoldCommercialTotal',

  description: 'Calculate data for accounts_not_active_gold_commercial_total event',

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
    const serviceName = 'gold_commercial';

    try {

      elapsedTimeStart = moment();

      const serviceRec = await Service.findOne({
        name: serviceName
      });

      if (serviceRec != null) {

        numAccounts = await Account.count({
          where: {
            deleted: false,
            banned: false,
            subscription_active: false,
            service: serviceRec.id,
          },
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

      } else {
        // throw new Error(`${moduleName}, error: No service with name="${serviceName}"`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: `No service with name="${serviceName}"`,
          errorName: sails.config.custom.ANALITICS_ERROR.name,
        });

      }


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


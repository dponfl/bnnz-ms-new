"use strict";

const moment = require('moment');

const moduleName = 'analytics:depositReceivedRub';


module.exports = {


  friendlyName: 'analytics:depositReceivedRub',

  description: 'Calculate data for deposits_received_rub event',

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
    let sum;
    const paymentType = sails.config.custom.enums.paymentGroupType.DEPOSIT;
    const paymentCurrency = sails.config.custom.enums.paymentCurrency.RUB;
    const paymentStatus = sails.config.custom.enums.paymentStatus.SUCCESS;

    try {

      elapsedTimeStart = moment();


      sum = await PaymentGroups.sum('amount', {
        where: {
          createdAt: {
            '>=': moment(inputs.start).format(),
            '<=': moment(inputs.end).format()
          },
          type: paymentType,
          currency: paymentCurrency,
          status: paymentStatus,
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
          value: sum,
          currency: paymentCurrency,
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


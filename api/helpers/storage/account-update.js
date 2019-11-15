"use strict";

module.exports = {


  friendlyName: 'Account update',


  description: 'Update record for the existing account',


  inputs: {

    criteria: {
      friendlyName: 'criteria',
      description: 'Criteria to update account record',
      type: 'ref',
      required: true,
    },

    data: {
      friendlyName: 'data',
      description: 'Data to update to the account record',
      type: 'ref',
      required: true,
    },


  },


  exits: {

    success: {
      description: 'All done.',
    },

    err: {
      description: 'Error',
    }

  },


  fn: async function (inputs, exits) {

    try {

      // sails.log.warn('*** storage:accountUpdate, inputs.data: ', inputs.data);
      const accountRec = _.omit(inputs.data, ['service', 'room']);
      // sails.log.warn('*** storage:accountUpdate, accountRec: ', accountRec);
      const serviceData = _.get(inputs.data, 'service');
      // sails.log.warn('*** storage:accountUpdate, serviceData: ', serviceData);

      // if (_.isNil(serviceData)) {
      //
      //   return exits.success({
      //     status: 'ok',
      //     message: 'Account record was not updated: no service info',
      //     payload: {
      //       criteria: inputs.criteria,
      //       client: inputs.data
      //     },
      //   });
      //
      // }

      if (serviceData) {
        accountRec.service = serviceData.id;
      } else {
        sails.log.warn('*** storage:accountUpdate, no service data in inputs.data: ', inputs.data);
      }


      await Account.update(inputs.criteria).set(accountRec);

      return exits.success({
        status: 'ok',
        message: 'Account record updated',
        payload: {
          criteria: inputs.criteria,
          client: inputs.data
        },
      })

    } catch (e) {

      const errorLocation = 'api/helpers/storage/account-update';
      const errorMsg = sails.config.custom.ACCOUNTUPDATE_ERROR;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
        }
      };
    }

  }


};


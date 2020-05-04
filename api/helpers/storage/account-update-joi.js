"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'storage:account-update-joi';

module.exports = {


  friendlyName: 'Account update',


  description: 'Update record for the existing account',


  inputs: {

    params: {
      friendlyName: 'input params',
      description: 'input params',
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

    const schema = Joi.object({
      criteria: Joi
                .any()
                .required()
                .description('Criteria to update only one account record'),
      data: Joi
            .any()
            .required()
            .description('Data to update to the account record'),
      createdBy: Joi
        .string()
        .description('source of update')
        .required(),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      const accountRec = _.omit(input.data, ['service', 'room', 'next_service']);
      const serviceData = _.get(input.data, 'service', null);
      const nextServiceData = _.get(input.data, 'next_service', null);

      if (serviceData != null) {
        accountRec.service = serviceData.id;
      }

      if (nextServiceData != null) {
        accountRec.next_service = nextServiceData.id;
      }

      const accountRecord = await Account.findOne({
        where: input.criteria,
      });

      if (accountRecord != null) {
        await sails.helpers.storage.accountFieldsPutJoi({
          accountGuid: accountRecord.guid,
          data: accountRec,
          createdBy: `${input.createdBy} => ${moduleName}`,
        })
      }

      await Account.update(input.criteria).set(accountRec);

      return exits.success({
        status: 'ok',
        message: 'Account record updated',
        payload: {
          criteria: input.criteria,
          data: input.data
        },
      })

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {
            error: e,
          },
        }
      };

    }

  }

};


"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'storage:payment-group-update-joi';

module.exports = {


  friendlyName: 'paymentGroup record update',


  description: 'paymentGroup record update',


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
        .description('Criteria to update only one paymentGroup record'),
      data: Joi
        .any()
        .required()
        .description('Data to update to the paymentGroup record'),
      createdBy: Joi
        .string()
        .description('source of update')
        .required(),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      let paymentGroupRec = input.data;

      /**
       * Добавить запись изменений значений в таблицу paymentGroupFields
       * по принципу того, как сделано ниже в закомментированном коде
       */

      // const accountRecord = await Account.findOne({
      //   where: input.criteria,
      // });
      //
      // if (accountRecord != null) {
      //   await sails.helpers.storage.accountFieldsPutJoi({
      //     accountGuid: accountRecord.guid,
      //     data: accountRec,
      //     createdBy: `${input.createdBy} => ${moduleName}`,
      //   })
      // }

      await PaymentGroups.update(input.criteria).set(paymentGroupRec);

      return exits.success({
        status: 'ok',
        message: 'paymentGroups record updated',
        payload: {
          criteria: input.criteria,
          data: paymentGroupRec,
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


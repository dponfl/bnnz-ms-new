"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'storage:payment-group-get-joi';


module.exports = {


  friendlyName: 'Payment group get',


  description: 'Get payment group record',


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
        .description('search criteria')
        .required(),
    });

    let input;


    try {

      input = await schema.validateAsync(inputs.params);


      const paymentGroupRecs = await PaymentGroups.find({
        where: input.criteria,
      });

      return exits.success({
        status: 'ok',
        message: 'Payment group record(s) found',
        payload: paymentGroupRecs, // array of objects or empty array
      })

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}, General error`;

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


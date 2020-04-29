"use strict";

const Joi = require('@hapi/joi');

const uuid = require('uuid-apikey');

const moduleName = 'storage:payment-group-create-joi';


module.exports = {


  friendlyName: 'Payment group create',


  description: 'Create payment group record',


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
      clientId: Joi
        .number()
        .integer()
        .positive()
        .description('client record id')
        .required(),
      clientGuid: Joi
        .string()
        .description('client record guid')
        .guid()
        .required(),
      accountGuid: Joi
        .string()
        .description('account record guid')
        .guid()
        .required(),
      amount: Joi
        .number()
        .integer()
        .positive()
        .description('amount')
        .required(),
      currency: Joi
        .string()
        .description('Three-letter ISO 4217 currency code (https://core.telegram.org/bots/payments#supported-currencies)')
        .max(3)
        .required(),
      type: Joi
        .string()
        .description('transaction type')
        .required(),
      status: Joi
        .string()
        .description('status')
        .required(),
      paymentProvider: Joi
        .string()
        .description('payment provider')
        .required(),
      messenger: Joi
        .string()
        .description('messenger')
        .max(50)
        .valid(sails.config.custom.enums.messenger.TELEGRAM)
        .required(),
      comments: Joi
        .string()
        .description('payment response'),
    });

    let input;


    try {

      input = await schema.validateAsync(inputs.params);

      const guid = uuid.create().uuid;

      const paymentGroupRec = await PaymentGroups
        .create({
        guid,
        type: input.type,
        status: input.status,
        payment_provider: input.paymentProvider,
        messenger: input.messenger,
        comments: input.comments || '',
        client_id: input.clientId,
        client_guid: input.clientGuid,
        account_guid: input.accountGuid,
        amount: input.amount,
        currency: input.currency,
      })
        .fetch();

      return exits.success({
        status: 'ok',
        message: 'Payment group record created',
        payload: paymentGroupRec,
      })

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}, error: ${sails.config.custom.PAYMENTGROUP_CREATE_ERROR}`;

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


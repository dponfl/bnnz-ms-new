"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:silver-personal:optin:callback-make-payment-second-on-payment-error-joi';


module.exports = {


  friendlyName: 'funnel:silver-personal:optin:callback-make-payment-second-on-payment-error-joi',


  description: 'funnel:silver-personal:optin:callback-make-payment-second-on-payment-error-joi',


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
      client: Joi
        .any()
        .description('client record')
        .required(),
      block: Joi
        .any()
        .description('funnel block initiated the payment process')
        .required(),
      paymentGroup: Joi
        .any()
        .description('paymentGroup record')
        .required(),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      /**
       * Устанавливаем значение для следующего блока в 'optin::payment_error'
       */

      input.block.next = 'optin::payment_error';

      /**
       * Устанавливае у следующего блока значение для предшествующего блока в 'optin::make_payment'
       */

      const splitRes = _.split(input.block.next, sails.config.custom.JUNCTION, 2);
      const updateFunnel = splitRes[0];
      const updateId = splitRes[1];


      const getBlock = _.find(input.client.funnels[updateFunnel], {id: updateId});

      if (getBlock) {
        getBlock.previous = 'optin::make_payment_02';
      }

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
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


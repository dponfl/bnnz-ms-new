"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:chat-blasts:test-personal-push-to-paid:callback-belike-make-payment-joi-on-payment-error-joi';


module.exports = {


  friendlyName: 'funnel:chat-blasts:test-personal-push-to-paid:callback-belike-make-payment-joi-on-payment-error-joi',


  description: 'funnel:chat-blasts:test-personal-push-to-paid:callback-belike-make-payment-joi-on-payment-error-joi',


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

    let clientGuid;
    let accountGuid;


    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;


      /**
       * Устанавливаем значение для следующего блока
       */

      input.block.next = 'chatBlasts.testPersonal.pushToPaid.funnelOne::belike_payment_error';

      /**
       * Устанавливаем у следующего блока значение для предшествующего блока
       */

      const splitRes = _.split(input.block.next, sails.config.custom.JUNCTION, 2);
      const updateFunnel = splitRes[0];
      const updateId = splitRes[1];


      const getBlock = _.find(input.client.funnels[updateFunnel], {id: updateId});

      if (getBlock) {
        getBlock.previous = 'chatBlasts.testPersonal.pushToPaid.funnelOne::belike_make_payment';
        getBlock.enabled = true;
      }

      await sails.helpers.storage.clientUpdateJoi({
        criteria: {guid: input.client.guid},
        data: input.client,
        createdBy: moduleName,
      });

      /**
       * Try to find the initial block of the current funnel
       */

      let initialBlock = _.find(input.client.funnels[input.client.current_funnel],
        {initial: true});

      /**
       * Check that the initial block was found
       */

      if (!_.isNil(initialBlock) && !_.isNil(initialBlock.id)) {

        await sails.helpers.funnel.proceedNextBlockJoi({
          client: input.client,
          funnelName: input.client.current_funnel,
          blockId: initialBlock.id,
          createdBy: moduleName,
        });

      } else {

        /**
         * Throw error -> initial block was not found
         */

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'Initial block not found',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR.name,
          payload: {
            currentFunnelName: input.client.current_funnel,
            currentFunnel: input.client.funnels[input.client.current_funnel],
          },
        });

      }

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      })

    } catch (e) {

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
          message: `${moduleName} not performed`,
          payload: {},
        });
      }

    }

  }

};


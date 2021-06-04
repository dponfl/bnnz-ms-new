"use strict";

const Joi = require('@hapi/joi');
const uuid = require('uuid-apikey');

const moduleName = 'funnel:common:optin:callback-make-payment-on-payment-error-joi';


module.exports = {


  friendlyName: 'funnel:common:optin:callback-make-payment-on-payment-error-joi',


  description: 'funnel:common:optin:callback-make-payment-on-payment-error-joi',


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

    let client;
    let account;

    let clientGuid;
    let accountGuid;


    try {

      input = await schema.validateAsync(inputs.params);

      client = input.client;
      account = _.find(client.accounts, {guid: client.account_use});

      clientGuid = client.guid;
      accountGuid = client.account_use;

      if (
        !_.isNil(input.block.messageGuid)
        && uuid.isUUID(input.block.messageGuid)
      ) {

        /**
         * Удаляем кнопки inline keyboard сообщения
         */

        const deleteInlineKeyboardButtonsParams = {
          client,
          account,
          messageGuid: input.block.messageGuid,
        }

        await sails.helpers.messageProcessor.deleteInlineKeyboardButtons(deleteInlineKeyboardButtonsParams);

      }

      /**
       * Устанавливаем флаги, что блок выполнен
       */

      input.block.done = true;
      input.block.shown = true;


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
        getBlock.previous = 'optin::make_payment';
        getBlock.enabled = true;
        getBlock.done = false;
        getBlock.shown = false;
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
          clientGuid,
          accountGuid,
          error: e,
          location: moduleName,
          throwError,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          clientGuid,
          accountGuid,
          error: e,
          location: moduleName,
          throwError,
        });
        return exits.success({
          status: 'error',
          message: `${moduleName} not performed`,
          payload: {},
        });
      }

    }

  }

};


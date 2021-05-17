"use strict";

const Joi = require('@hapi/joi');
const uuid = require('uuid-apikey');

const moduleName = 'funnel:common:optin:callback-make-payment-third-on-payment-success-joi';


module.exports = {


  friendlyName: 'funnel:common:optin:callback-make-payment-third-on-payment-success-joi',


  description: 'funnel:common:optin:callback-make-payment-third-on-payment-success-joi',


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

    let splitRes;
    let updateFunnel;
    let updateId;
    let getBlock;

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
       * Устанавливаем значение для следующего блока в 'optin::payment_successful'
       */

      input.block.next = 'optin::payment_successful';

      /**
       * Устанавливае у следующего блока значение для предшествующего блока в 'optin::more_info_03'
       */

      splitRes = _.split(input.block.next, sails.config.custom.JUNCTION, 2);
      updateFunnel = splitRes[0];
      updateId = splitRes[1];


      getBlock = _.find(client.funnels[updateFunnel], {id: updateId});

      if (getBlock) {
        getBlock.previous = 'optin::more_info_03';
        getBlock.enabled = true;
      }

      await sails.helpers.storage.clientUpdateJoi({
        criteria: {guid: client.guid},
        data: {funnels: client.funnels},
        createdBy: moduleName,
      });

      /**
       * Try to find the initial block of the current funnel
       */

      let initialBlock = _.find(client.funnels[client.current_funnel],
        {initial: true});

      /**
       * Check that the initial block was found
       */

      if (!_.isNil(initialBlock) && !_.isNil(initialBlock.id)) {

        await sails.helpers.funnel.proceedNextBlockJoi({
          client,
          funnelName: client.current_funnel,
          blockId: initialBlock.id,
          createdBy: moduleName,
        });

      } else {

        /**
         * Throw error -> initial block was not found
         */

        // throw new Error(`${moduleName}, error: initial block was not found`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'Initial block not found',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR.name,
          payload: {
            currentFunnelName: client.current_funnel,
            currentFunnel: client.funnels[client.current_funnel],
          },
        });

      }


      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      })

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
      //     payload: {
      //       error: e,
      //     },
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

  }

};


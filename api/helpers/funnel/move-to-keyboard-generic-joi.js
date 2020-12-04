"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:move-to-keyboard-generic-joi';


module.exports = {


  friendlyName: 'funnel:move-to-keyboard-generic-joi',


  description: 'funnel:move-to-keyboard-generic-joi',


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
      // account: Joi
      //   .any()
      //   .description('current account record')
      //   .required(),
      block: Joi
        .any()
        .description('Current funnel block')
        .required(),
      keyboardName: Joi
        .string()
        .description('name of keyboard')
        .required(),
      updateCurrentBlock: Joi
        .boolean()
        .description('flag if to update block')
        .default(true),
      currentBlockDone: Joi
        .boolean()
        .description('flag if to set block.done = true')
        .default(true),
      currentBlockShown: Joi
        .boolean()
        .description('flag if to set block.shown = true')
        .default(true),
      callAfterHelperGeneric: Joi
        .boolean()
        .description('flag to call  afterHelperGenericJoi')
        .default(true),
      afterHelperNext: Joi
        .boolean()
        .description('value to set for afterHelperGenericJoi "next" parameter')
        .default(true),
      afterHelperPrevious: Joi
        .boolean()
        .description('value to set for afterHelperGenericJoi "previous" parameter')
        .default(true),
      afterHelperSwitchFunnel: Joi
        .boolean()
        .description('value to set for afterHelperGenericJoi "switchFunnel" parameter')
        .default(true),
      additionalData: Joi
        .any()
        .description('additional data'),
      msg: Joi
        .any()
        .description('Message received'),
      createdBy: Joi
        .string()
        .description('source of update')
        .required(),
    });

    let input;

    let clientGuid;
    let accountGuid;


    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});

      input.client.current_funnel = '';

      await sails.helpers.storage.clientUpdateJoi({
        criteria: {guid: input.client.guid},
        data: {
          current_funnel: ''
        },
        createdBy: moduleName,
      });

      currentAccount.keyboard = input.keyboardName;

      if (input.updateCurrentBlock) {

        input.block.done = input.currentBlockDone;
        input.block.shown = input.currentBlockShown;

      }


      if (input.callAfterHelperGeneric) {

        await sails.helpers.funnel.afterHelperGenericJoi({
          client: input.client,
          block: input.block,
          msg: input.msg,
          next: input.afterHelperNext,
          previous: input.afterHelperPrevious,
          switchFunnel: input.afterHelperSwitchFunnel,
          createdBy: `${input.createdBy} => ${moduleName}`,
        });

      }

      const sendKeyboardForAccountParams = {
        client: input.client,
      };

      if (input.additionalData != null) {
        sendKeyboardForAccountParams.additionalData = input.additionalData;
      }

      const sendKeyboardForAccountRaw = await sails.helpers.keyboardProcessor.sendKeyboardForAccountJoi(sendKeyboardForAccountParams);

      if (sendKeyboardForAccountRaw.status !== 'ok') {

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Wrong sendKeyboardForAccountJoi response',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR.name,
          payload: {
            sendKeyboardForAccountParams,
            sendKeyboardForAccountRaw,
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
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
            input,
          }
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
            input,
          }
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


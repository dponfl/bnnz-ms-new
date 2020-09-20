"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:next-block-activation-generic-joi';


module.exports = {


  friendlyName: 'funnel:next-block-activation-generic-joi',


  description: 'funnel:next-block-activation-generic-joi',


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
      account: Joi
        .any()
        .description('current account record')
        .required(),
      block: Joi
        .any()
        .description('Current funnel block')
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
      updateElement: Joi
        .string()
        .description('block element to be updated, e.g. "next"')
        .required(),
      updateElementValue: Joi
        .string()
        .description('new value for the block element')
        .required(),
      updateElementDone: Joi
        .boolean()
        .description('flag if to set "updateElement".done = false')
        .default(false),
      updateElementShown: Joi
        .boolean()
        .description('flag if to set "updateElement".shown = false')
        .default(false),
      updateElementPreviousValue: Joi
        .string()
        .description('value to set "updateElement".previous'),
      createdBy: Joi
        .string()
        .description('source of update')
        .required(),
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
      msg: Joi
        .any()
        .description('Message received'),
      callAfterHelperGeneric: Joi
        .boolean()
        .description('flag to call  afterHelperGenericJoi')
        .default(true),
    });

    let input;

    let clientGuid;
    let accountGuid;

    let updateBlock;
    let getBlock;
    let splitRes;
    let updateFunnel;
    let updateId;


    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      /**
       * Выполняем переход на input.updateElementValue
       */

      if (input.updateCurrentBlock) {

        input.block[input.updateElement] = input.updateElementValue;
        input.block.done = input.currentBlockDone;
        input.block.shown = input.currentBlockShown;

      }

      /**
       * Update input.block[input.updateElement] block
       */

      updateBlock = input.block[input.updateElement];

      splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
      updateFunnel = splitRes[0];
      updateId = splitRes[1];

      if (_.isNil(updateFunnel)
        || _.isNil(updateId)
      ) {

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'Block parsing error',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR.name,
          payload: {
            updateBlock,
            block: input.block,
          },
        });

      }

      getBlock = _.find(input.client.funnels[updateFunnel], {id: updateId});

      if (getBlock) {
        getBlock.shown = input.updateElementShown;
        getBlock.done = input.updateElementDone;
        if (input.updateElementPreviousValue) {
          getBlock.previous = input.updateElementPreviousValue;
        }
      } else {

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'Block not found',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR.name,
          payload: {
            updateId,
            updateFunnel,
            funnel: input.client.funnels[updateFunnel],
          },
        });

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
          location: `${input.createdBy} => ${moduleName}`,
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
          location: `${input.createdBy} => ${moduleName}`,
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


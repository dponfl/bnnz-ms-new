"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:after-helper-generic-joi';

module.exports = {


  friendlyName: 'After helper generic',


  description: 'Generic afterHelper',


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

    /**
     * Perform general activities after the block was performed, like:
     * 1) if next block is specified -> we need to enable it
     * 2) if previous block is specified -> we need to mark it as done
     * 3) if switchToFunnel not null -> we need switch to the specific funnel
     */

    const schema = Joi.object({
      client: Joi
        .any()
        .description('Client record')
        .required(),
      block: Joi
        .any()
        .description('Current funnel block')
        .required(),
      next: Joi
        .boolean()
        .description('flag if we allow to enable the next funnel block')
        .required(),
      previous: Joi
        .boolean()
        .description('flag if we allow to mark the previous funnel block as done')
        .required(),
      switchFunnel: Joi
        .boolean()
        .description('flag if we allow to switch to the different funnel specified by switchToFunnel')
        .required(),
      msg: Joi
        .any()
        .description('Message received'),
    });


    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      /**
       * Update at client record the block specified at input.block
       */

      if (input.next && input.block.next) {

        let splitRes = _.split(input.block.next, sails.config.custom.JUNCTION, 2);
        let nextFunnel = splitRes[0];
        let nextId = splitRes[1];

        if (
          nextFunnel
          && nextId
        ) {

          if (!_.has(input.client.funnels, nextFunnel)) {
            throw new Error(`funnel not found, \nfunnels: ${JSON.stringify(input.client.funnels, null, 3)} \n\nnextFunnel : ${nextFunnel}`);
          }

          let nextBlock = _.find(input.client.funnels[nextFunnel], {id: nextId});
          if (nextBlock) {
            nextBlock.enabled = true;
          } else {
            throw new Error(`nextBlock not found: \ninput.client.funnels[nextFunnel]: ${JSON.stringify(input.client.funnels[nextFunnel], null, 3)} \nnextId : ${nextId}`);
          }

        }

      }

      if (input.previous && input.block.previous) {

        let splitRes = _.split(input.block.previous, sails.config.custom.JUNCTION, 2);
        let previousFunnel = splitRes[0];
        let previousId = splitRes[1];

        if (
          previousFunnel
          && previousId
        ) {

          if (!_.has(input.client.funnels, previousFunnel)) {
            throw new Error(`funnel not found, \nfunnels: ${JSON.stringify(input.client.funnels, null, 3)} \n\npreviousFunnel : ${previousFunnel}`);
          }

          let previousBlock = _.find(input.client.funnels[previousFunnel], {id: previousId});
          if (previousBlock) {
            previousBlock.done = true;
          } else {
            throw new Error(`previousBlock not found: \ninput.client.funnels[previousFunnel]: ${JSON.stringify(input.client.funnels[previousFunnel], null, 3)} \npreviousId : ${previousId}`);
          }

        }

      }

      if (input.switchFunnel && input.block.switchToFunnel) {

        /**
         * We need to switch client to the specified funnel
         */

        if (!_.has(input.client.funnels, input.block.switchToFunnel)) {
          throw new Error(`funnel not found, \nfunnels: ${JSON.stringify(input.client.funnels, null, 3)} \n\ninput.block.switchToFunnel : ${input.block.switchToFunnel}`);
        }

        input.client.current_funnel = input.block.switchToFunnel;

      }

      // await sails.helpers.storage.clientUpdateJoi({
      //   criteria: {guid: input.client.guid},
      //   data: input.client,
      //   createdBy: moduleName,
      // });

      await sails.helpers.storage.clientUpdateJoi({
        criteria: {guid: input.client.guid},
        data: {
          current_funnel: input.client.current_funnel,
          funnels: input.client.funnels,
        },
        createdBy: moduleName,
      });


      return exits.success();

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: ${sails.config.custom.AFTERHELPERGENERIC_ERROR}`;

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


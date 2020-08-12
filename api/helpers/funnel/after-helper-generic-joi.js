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
            // throw new Error(`funnel not found, \nfunnels: ${JSON.stringify(input.client.funnels, null, 3)} \n\nnextFunnel : ${nextFunnel}`);

            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'funnel not found',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.FUNNELS_ERROR.name,
              payload: {
                inputBlockNext: input.block.next,
                nextFunnel,
                inputClientFunnels: input.client.funnels,
              },
            });

          }

          let nextBlock = _.find(input.client.funnels[nextFunnel], {id: nextId});
          if (nextBlock) {
            nextBlock.enabled = true;
          } else {
            // throw new Error(`nextBlock not found: \nnextFunnel : ${nextFunnel} \nnextId : ${nextId} \ninput.client.funnels[nextFunnel]: ${JSON.stringify(input.client.funnels[nextFunnel], null, 3)}`);

            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'nextBlock not found',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.FUNNELS_ERROR.name,
              payload: {
                nextId,
                inputClientFunnelsNextFunnel: input.client.funnels[nextFunnel],
              },
            });

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
            // throw new Error(`funnel not found, \nfunnels: ${JSON.stringify(input.client.funnels, null, 3)} \n\npreviousFunnel : ${previousFunnel}`);

            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'funnel not found',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.FUNNELS_ERROR.name,
              payload: {
                inputBlockPrevious: input.block.previous,
                previousFunnel,
                inputClientFunnels: input.client.funnels,
              },
            });

          }

          let previousBlock = _.find(input.client.funnels[previousFunnel], {id: previousId});
          if (previousBlock) {
            previousBlock.done = true;
            previousBlock.shown = true;
          } else {
            // throw new Error(`previousBlock not found: \ninput.client.funnels[previousFunnel]: ${JSON.stringify(input.client.funnels[previousFunnel], null, 3)} \npreviousId : ${previousId}`);

            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'previousBlock not found',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.FUNNELS_ERROR.name,
              payload: {
                previousId,
                inputClientFunnelsNextFunnel: input.client.funnels[previousFunnel],
              },
            });

          }

        }

      }

      if (input.switchFunnel && input.block.switchToFunnel) {

        /**
         * We need to switch client to the specified funnel
         */

        if (!_.has(input.client.funnels, input.block.switchToFunnel)) {
          // throw new Error(`funnel not found, \nfunnels: ${JSON.stringify(input.client.funnels, null, 3)} \n\ninput.block.switchToFunnel : ${input.block.switchToFunnel}`);

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'funnel not found',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.FUNNELS_ERROR.name,
            payload: {
              inputBlockSwitchToFunnel: input.block.switchToFunnel,
              inputClientFunnels: input.client.funnels,
            },
          });

        }

        input.client.current_funnel = input.block.switchToFunnel;

      }

      await sails.helpers.storage.clientUpdateJoi({
        criteria: {guid: input.client.guid},
        data: input.client,
        createdBy: `${input.createdBy} => ${moduleName}`,
      });

      // await sails.helpers.storage.clientUpdateJoi({
      //   criteria: {guid: input.client.guid},
      //   data: {
      //     current_funnel: input.client.current_funnel,
      //     funnels: input.client.funnels,
      //   },
      //   createdBy: moduleName,
      // });


      return exits.success();

    } catch (e) {

      // const errorLocation = moduleName;
      // const errorMsg = `${moduleName}: ${sails.config.custom.AFTERHELPERGENERIC_ERROR}`;
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


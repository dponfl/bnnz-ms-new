"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:silver-personal:optin:callback-join-ref-start-joi';


module.exports = {


  friendlyName: 'funnel:silver-personal:optin:callback-join-ref-start-joi',


  description: 'funnel:silver-personal:optin:callback-join-ref-start-joi',


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
        .description('Client record')
        .required(),
      block: Joi
        .any()
        .description('Current funnel block')
        .required(),
      query: Joi
        .any()
        .description('Callback query received')
        .required(),
    });

    let input;

    let clientGuid;
    let accountGuid;


    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;


      let blockName;
      let blockNameSplitRes;
      let blockFunnel;
      let blockId;
      let blockData;

      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});

      switch (input.query.data) {
        case 'join':
          input.block.next = 'optin::join_ref_prepare_list';

          blockName = input.block.next;
          blockNameSplitRes = _.split(blockName, sails.config.custom.JUNCTION, 2);
          blockFunnel = blockNameSplitRes[0];
          blockId = blockNameSplitRes[1];

          if (_.isNil(blockFunnel)
            || _.isNil(blockId)
          ) {
            // throw new Error(`${moduleName}, error: parsing error of ${blockName}`);

            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'Block parsing error',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.FUNNELS_ERROR,
              payload: {
                blockName,
                block: input.block,
              },
            });

          }

          blockData = _.find(input.client.funnels[blockFunnel], {id: blockId});

          if (blockData) {
            blockData.shown = false;
            blockData.done = false;
            blockData.previous = 'optin::join_ref_start';

          } else {
            // throw new Error(`${moduleName}, error: block not found:
            //  blockName: ${blockName}
            //  blockFunnel: ${blockFunnel}
            //  blockId: ${blockId}
            //  input.client.funnels[blockFunnel]: ${JSON.stringify(input.client.funnels[blockFunnel], null, 3)}`);

            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'Block not found',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.FUNNELS_ERROR,
              payload: {
                blockId,
                blockFunnel,
                funnel: input.client.funnels[blockFunnel],
              },
            });

          }

          break;
        case 'not_join':
          input.block.next = 'optin::join_ref_no';

          blockName = input.block.next;
          blockNameSplitRes = _.split(blockName, sails.config.custom.JUNCTION, 2);
          blockFunnel = blockNameSplitRes[0];
          blockId = blockNameSplitRes[1];

          if (_.isNil(blockFunnel)
            || _.isNil(blockId)
          ) {
            // throw new Error(`${moduleName}, error: parsing error of ${blockName}`);

            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'Block parsing error',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.FUNNELS_ERROR,
              payload: {
                blockName,
                block: input.block,
              },
            });

          }

          blockData = _.find(input.client.funnels[blockFunnel], {id: blockId});

          if (blockData) {
            blockData.shown = false;
            blockData.done = false;
            blockData.previous = 'optin::join_ref_start';

          } else {
            // throw new Error(`${moduleName}, error: block not found:
            //  blockName: ${blockName}
            //  blockFunnel: ${blockFunnel}
            //  blockId: ${blockId}
            //  input.client.funnels[blockFunnel]: ${JSON.stringify(input.client.funnels[blockFunnel], null, 3)}`);

            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'Block not found',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.FUNNELS_ERROR,
              payload: {
                blockId,
                blockFunnel,
                funnel: input.client.funnels[blockFunnel],
              },
            });

          }

          break;
        case 'need_more_info':
          input.block.next = 'optin::join_ref_more_info_first';

          blockName = input.block.next;
          blockNameSplitRes = _.split(blockName, sails.config.custom.JUNCTION, 2);
          blockFunnel = blockNameSplitRes[0];
          blockId = blockNameSplitRes[1];

          if (_.isNil(blockFunnel)
            || _.isNil(blockId)
          ) {
            // throw new Error(`${moduleName}, error: parsing error of ${blockName}`);

            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'Block parsing error',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.FUNNELS_ERROR,
              payload: {
                blockName,
                block: input.block,
              },
            });

          }

          blockData = _.find(input.client.funnels[blockFunnel], {id: blockId});

          if (blockData) {
            blockData.shown = false;
            blockData.done = false;
            blockData.previous = 'optin::join_ref_start';

          } else {
            // throw new Error(`${moduleName}, error: block not found:
            //  blockName: ${blockName}
            //  blockFunnel: ${blockFunnel}
            //  blockId: ${blockId}
            //  input.client.funnels[blockFunnel]: ${JSON.stringify(input.client.funnels[blockFunnel], null, 3)}`);

            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'Block not found',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.FUNNELS_ERROR,
              payload: {
                blockId,
                blockFunnel,
                funnel: input.client.funnels[blockFunnel],
              },
            });

          }

          break;
        default:
          // throw new Error(`${moduleName}, error: Wrong callback data: ${input.query.data}`);

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Wrong callback data',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.FUNNELS_ERROR,
            payload: {
              inputQueryData: input.query.data,
            },
          });

      }

      input.block.done = true;

      await sails.helpers.funnel.afterHelperGenericJoi({
        client: input.client,
        block: input.block,
        msg: input.query,
        next: true,
        previous: true,
        switchFunnel: true,
        createdBy: moduleName,
      });

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


"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:silver-personal:optin:callback-join-ref-missed-profiles-joi';


module.exports = {


  friendlyName: 'funnel:silver-personal:optin:callback-join-ref-missed-profiles-joi',


  description: 'funnel:silver-personal:optin:callback-join-ref-missed-profiles-joi',


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


      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});

      switch (input.query.data) {
        case 'check':
          input.block.next = 'optin::join_ref_check';

          const blockName = input.block.next;
          const blockNameSplitRes = _.split(blockName, sails.config.custom.JUNCTION, 2);
          const blockFunnel = blockNameSplitRes[0];
          const blockId = blockNameSplitRes[1];

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

          const blockData = _.find(input.client.funnels[blockFunnel], {id: blockId});

          if (blockData) {
            blockData.shown = false;
            blockData.done = false;
            blockData.next = null;
            blockData.previous = 'optin::join_ref_missed_profiles';

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
        previous: false,
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


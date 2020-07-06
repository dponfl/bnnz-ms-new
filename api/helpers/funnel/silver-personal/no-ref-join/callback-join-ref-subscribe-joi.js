"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:silver-personal:no-ref-join:callback-join-ref-subscribe-joi';


module.exports = {


  friendlyName: 'funnel:silver-personal:no-ref-join:callback-join-ref-subscribe-joi',


  description: 'funnel:silver-personal:no-ref-join:callback-join-ref-subscribe-joi',


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

    try {

      input = await schema.validateAsync(inputs.params);

      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});

      switch (input.query.data) {
        case 'check':
          input.block.next = 'noRefJoin::join_ref_check';

          currentAccount.subscription_confirmed_by_client = true;

          const blockName = input.block.next;
          const blockNameSplitRes = _.split(blockName, sails.config.custom.JUNCTION, 2);
          const blockFunnel = blockNameSplitRes[0];
          const blockId = blockNameSplitRes[1];

          if (_.isNil(blockFunnel)
            || _.isNil(blockId)
          ) {
            throw new Error(`${moduleName}, error: parsing error of ${blockName}`);
          }

          const blockData = _.find(input.client.funnels[blockFunnel], {id: blockId});

          if (blockData) {
            blockData.shown = false;
            blockData.done = false;
            blockData.next = null;
            blockData.previous = 'noRefJoin::join_ref_subscribe';

          } else {
            throw new Error(`${moduleName}, error: block not found:
             blockName: ${blockName}
             blockFunnel: ${blockFunnel}
             blockId: ${blockId}
             input.client.funnels[blockFunnel]: ${JSON.stringify(input.client.funnels[blockFunnel], null, 3)}`);
          }

          break;
        default:
          throw new Error(`${moduleName}, error: Wrong callback data: ${input.query.data}`);
      }

      input.block.done = true;
      input.block.shown = true;

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


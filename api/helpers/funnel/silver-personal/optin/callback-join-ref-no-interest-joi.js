"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:silver-personal:optin:callback-join-ref-no-interest-joi';


module.exports = {


  friendlyName: 'funnel:silver-personal:optin:callback-join-ref-no-interest-joi',


  description: 'funnel:silver-personal:optin:callback-join-ref-no-interest-joi',


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

      let blockName;
      let blockNameSplitRes;
      let blockFunnel;
      let blockId;
      let blockData;

      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});
      const currentAccountInd = _.findIndex(input.client.accounts, (o) => {
        return o.guid === currentAccount.guid;
      });

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
            throw new Error(`${moduleName}, error: parsing error of ${blockName}`);
          }

          blockData = _.find(input.client.funnels[blockFunnel], {id: blockId});

          if (blockData) {
            blockData.shown = false;
            blockData.done = false;
            blockData.previous = 'optin::join_ref_no_interest';

          } else {
            throw new Error(`${moduleName}, error: block not found:
             blockName: ${blockName}
             blockFunnel: ${blockFunnel}
             blockId: ${blockId}
             input.client.funnels[blockFunnel]: ${JSON.stringify(input.client.funnels[blockFunnel], null, 3)}`);
          }

          break;
        case 'not_join':
          input.block.next = 'optin::no_ref_done';

          blockName = input.block.next;
          blockNameSplitRes = _.split(blockName, sails.config.custom.JUNCTION, 2);
          blockFunnel = blockNameSplitRes[0];
          blockId = blockNameSplitRes[1];

          if (_.isNil(blockFunnel)
            || _.isNil(blockId)
          ) {
            throw new Error(`${moduleName}, error: parsing error of ${blockName}`);
          }

          blockData = _.find(input.client.funnels[blockFunnel], {id: blockId});

          if (blockData) {
            blockData.shown = false;
            blockData.done = false;
            blockData.previous = 'optin::join_ref_no_interest';

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


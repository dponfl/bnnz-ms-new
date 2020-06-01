"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'module:helper';


module.exports = {


  friendlyName: 'module:helper',


  description: 'module:helper',


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
      msg: Joi
        .any()
        .description('Message received'),
    });

    let input;

    let updateBlock;
    let getBlock;
    let splitRes;
    let updateFunnel;
    let updateId;

    try {

      input = await schema.validateAsync(inputs.params);

      /**
       * Update xxx::xxx block
       */

      updateBlock = 'xxx::xxx';

      splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
      updateFunnel = splitRes[0];
      updateId = splitRes[1];

      if (_.isNil(updateFunnel)
        || _.isNil(updateId)
      ) {
        throw new Error(`${moduleName}, error: parsing error of ${updateBlock}`);
      }

      getBlock = _.find(input.client.funnels[updateFunnel], {id: updateId});

      if (getBlock) {
        getBlock.shown = false;
        getBlock.done = false;
        getBlock.next = null;
      } else {
        throw new Error(`${moduleName}, error: block not found:
             updateBlock: ${updateBlock}
             updateFunnel: ${updateFunnel}
             updateId: ${updateId}
             input.client.funnels[updateFunnel]: ${JSON.stringify(input.client.funnels[updateFunnel], null, 3)}`);
      }

      await sails.helpers.funnel.afterHelperGenericJoi({
        client: input.client,
        block: input.block,
        msg: input.msg,
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

      const errorMsg = 'General error';

      sails.log.error(`${moduleName}, Error details:
      Platform error message: ${errorMsg}
      Error name: ${e.name || 'no name'}
      Error message: ${e.message || 'no message'}
      Error stack: ${JSON.stringify(e.stack || {}, null, 3)}`);

      throw {err: {
          module: `${moduleName}`,
          message: errorMsg,
          payload: {
            error_name: e.name || 'no name',
            error_message: e.message || 'no message',
            error_stack: e.stack || {},
          },
        }
      };

    }

  }

};


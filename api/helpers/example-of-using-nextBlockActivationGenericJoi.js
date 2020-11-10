"use strict";


"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'example-of-using-nextBlockActivationGenericJoi';


module.exports = {


  friendlyName: 'example-of-using-nextBlockActivationGenericJoi',


  description: 'example-of-using-nextBlockActivationGenericJoi',


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

    let currentAccount = null;

// Пример использование из хелпера:
// api/helpers/funnel/common/ref-profile-subscription-check/after-subscription-check-joi.js


    /**
     * Выполняем переход на join_ref_check_error
     */

    const nextBlockActivationGenericParams = {
      client: input.client,
      account: currentAccount,
      block: input.block,
      updateElement: 'next',
      updateElementValue: 'refProfileSubscriptionCheck::join_ref_check_error',
      updateElementPreviousValue: 'refProfileSubscriptionCheck::join_ref_check',
      createdBy: moduleName,
      msg: input.msg,
    };

    await sails.helpers.funnel.nextBlockActivationGenericJoi(nextBlockActivationGenericParams);

    /**
     * Это то, что заменяет код выше
     */

//
// input.block.next = 'refProfileSubscriptionCheck::join_ref_check_error';
// input.block.done = true;
// input.block.shown = true;
//
// /**
//  * Update input.block.next block
//  */
//
// updateBlock = input.block.next;
//
// splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
// updateFunnel = splitRes[0];
// updateId = splitRes[1];
//
// if (_.isNil(updateFunnel)
//   || _.isNil(updateId)
// ) {
//
//   await sails.helpers.general.throwErrorJoi({
//     errorType: sails.config.custom.enums.errorType.CRITICAL,
//     emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
//     location: moduleName,
//     message: 'Block parsing error',
//     clientGuid,
//     accountGuid,
//     errorName: sails.config.custom.FUNNELS_ERROR.name,
//     payload: {
//       updateBlock,
//       block: input.block,
//     },
//   });
//
// }
//
// getBlock = _.find(input.client.funnels[updateFunnel], {id: updateId});
//
// if (getBlock) {
//   getBlock.shown = false;
//   getBlock.done = false;
//   getBlock.previous = 'refProfileSubscriptionCheck::join_ref_check';
// } else {
//
//   await sails.helpers.general.throwErrorJoi({
//     errorType: sails.config.custom.enums.errorType.CRITICAL,
//     emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
//     location: moduleName,
//     message: 'Block not found',
//     clientGuid,
//     accountGuid,
//     errorName: sails.config.custom.FUNNELS_ERROR.name,
//     payload: {
//       updateId,
//       updateFunnel,
//       funnel: input.client.funnels[updateFunnel],
//     },
//   });
//
// }
//
// await sails.helpers.funnel.afterHelperGenericJoi({
//   client: input.client,
//   block: input.block,
//   msg: input.msg,
//   next: true,
//   previous: true,
//   switchFunnel: true,
//   createdBy: moduleName,
// });

    return exits.success({
      status: 'ok',
      message: `${moduleName} performed`,
      payload: {},
    })

  }

};


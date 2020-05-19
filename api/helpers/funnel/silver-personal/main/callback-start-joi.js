"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:silver-personal:main:callback-start-joi';


module.exports = {


  friendlyName: 'funnel:silver-personal:main:callback-start-joi',


  description: 'funnel:silver-personal:main:callback-start-joi',


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

    let updateBlock;
    let getBlock;
    let splitRes;
    let updateFunnel;
    let updateId;

    try {

      input = await schema.validateAsync(inputs.params);

      switch (input.query.data) {
        case 'start_upload':

          const checkDayPostsJoiRaw = await sails.helpers.general.checkDayPostsJoi({
            client: input.client,
          });

          if (checkDayPostsJoiRaw.status !== 'ok') {
            throw new Error(`${moduleName}, error: wrong checkDayPostsJoi reply:
            client: ${input.client}
            checkDayPostsJoiRaw: ${checkDayPostsJoiRaw}`);
          }

          const dayPostsReached =  checkDayPostsJoiRaw.payload.dayPostsReached;

          if (dayPostsReached) {

            /**
             * Дневной лимит отправки постов достигнут
             */

            input.block.next = 'main::daily_post_limit_reached';
            input.block.done = true;

            /**
             * Update input.block.next block
             */

            updateBlock = input.block.next;

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
              getBlock.previous = 'main::start';
            } else {
              throw new Error(`${moduleName}, error: block not found:
              updateBlock: ${updateBlock}
              updateFunnel: ${updateFunnel}
              updateId: ${updateId}
              input.client.funnels[updateFunnel]: ${JSON.stringify(input.client.funnels[updateFunnel], null, 3)}`);
            }

          } else {

            /**
             * Дневной лимит отправки постов НЕ достигнут
             */

            input.block.next = 'main::provide_post_link';
            input.block.done = true;

            /**
             * Update input.block.next block
             */

            updateBlock = input.block.next;

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
              getBlock.previous = 'main::start';
            } else {
              throw new Error(`${moduleName}, error: block not found:
              updateBlock: ${updateBlock}
              updateFunnel: ${updateFunnel}
              updateId: ${updateId}
              input.client.funnels[updateFunnel]: ${JSON.stringify(input.client.funnels[updateFunnel], null, 3)}`);
            }

          }

          break;
        default:
          throw new Error(`${moduleName}, error: Wrong callback data: ${input.query.data}`);
      }

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

